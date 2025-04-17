// src/contexts/SendContext.js
"use client";

import { createContext, useContext, useState, useCallback } from "react";
import { supabase } from "@/utils/supabaseClient";
import { ethers } from "ethers";
import { toast } from "react-toastify";
import { getGasPrice } from "@/utils/getGasPrice";
import { useAuth } from "@/contexts/AuthContext";
import { useBalance } from "@/contexts/BalanceContext";
import { useNetwork } from "@/contexts/NetworkContext";

// — RPC endpoints with fallback providers
export const RPC = {
  eth:   { urls: ["https://rpc.ankr.com/eth","https://eth.llamarpc.com"],         chainId:1,    name:"eth"   },
  bnb:   { urls: ["https://bsc-dataseed.binance.org/","https://bsc.publicnode.com"],chainId:56,   name:"bnb"   },
  tbnb:  { urls: ["https://data-seed-prebsc-1-s1.binance.org:8545/","https://bsc-testnet.public.blastapi.io"], chainId:97, name:"tbnb"  },
  matic: { urls: ["https://polygon-bor.publicnode.com","https://1rpc.io/matic"],   chainId:137,  name:"matic" },
  avax:  { urls: ["https://rpc.ankr.com/avalanche","https://avalanche.drpc.org"], chainId:43114, name:"avax"  },
};

// — AES‑GCM decryption (PBKDF2)
const encode = s => new TextEncoder().encode(s);
const decode = b => new TextDecoder().decode(b);

const getKey = async () => {
  const mat = await window.crypto.subtle.importKey(
    "raw",
    encode(process.env.NEXT_PUBLIC_ENCRYPTION_SECRET || "super_secret"),
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  );

  return window.crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: encode("nordbalticum-salt"),
      iterations: 100_000,
      hash: "SHA-256",
    },
    mat,
    { name: "AES-GCM", length: 256 },
    false,
    ["decrypt"]
  );
};

const decrypt = async ciphertext => {
  const { iv, data } = JSON.parse(atob(ciphertext));
  const key = await getKey();
  const decrypted = await window.crypto.subtle.decrypt(
    { name: "AES-GCM", iv: new Uint8Array(iv) },
    key,
    new Uint8Array(data)
  );
  return decode(decrypted);
};

// — Map our shorthand to CoinGecko / DB naming
const mapNetwork = net => (net === "matic" ? "polygon" : net);

// — Context & hook
const SendContext = createContext();
export const useSend = () => useContext(SendContext);

export function SendProvider({ children }) {
  const { safeRefreshSession } = useAuth();
  const { refetch } = useBalance();
  const { activeNetwork } = useNetwork();

  const [sending, setSending]       = useState(false);
  const [gasFee, setGasFee]         = useState(0);
  const [adminFee, setAdminFee]     = useState(0);
  const [totalFee, setTotalFee]     = useState(0);
  const [feeLoading, setFeeLoading] = useState(false);
  const [feeError, setFeeError]     = useState(null);

  // — Build a FallbackProvider for any network
  const getProvider = network =>
    new ethers.FallbackProvider(
      RPC[network].urls.map(url =>
        new ethers.JsonRpcProvider(url, {
          chainId: RPC[network].chainId,
          name: RPC[network].name,
        })
      )
    );

  // — Estimate gas + admin fee
  const calculateFees = useCallback(async (network, amount) => {
    if (!network || amount <= 0) return;
    setFeeLoading(true);
    setFeeError(null);

    try {
      const provider = getProvider(network);
      let gasPrice;
      try {
        gasPrice = await getGasPrice(provider);
      } catch {
        gasPrice = ethers.parseUnits("5", "gwei");
      }

      // double gas buffer (21000 * 2)
      const gasCost    = Number(ethers.formatEther(gasPrice * 21000n * 2n));
      const adminCost  = Number(amount) * 0.03;
      setGasFee(gasCost);
      setAdminFee(adminCost);
      setTotalFee(gasCost + adminCost);
    } catch (err) {
      setFeeError(err.message || "Fee calculation failed");
      setGasFee(0);
      setAdminFee(0);
      setTotalFee(0);
    } finally {
      setFeeLoading(false);
    }
  }, []);

  // — Send with fallback, 2‑step: admin fee then user
  const sendTransaction = async ({ to, amount, userEmail }) => {
    if (!to || amount <= 0 || !activeNetwork || !userEmail) {
      throw new Error("Missing transaction data");
    }

    const ADMIN = process.env.NEXT_PUBLIC_ADMIN_WALLET;
    if (!ADMIN) {
      throw new Error("Admin wallet not configured");
    }

    setSending(true);

    try {
      // 1) Refresh session & balances
      await safeRefreshSession();
      await refetch();

      // 2) Fetch encrypted key
      const { data, error } = await supabase
        .from("wallets")
        .select("encrypted_key")
        .eq("user_email", userEmail)
        .single();

      if (error || !data?.encrypted_key) {
        throw new Error("Failed to retrieve encrypted key");
      }

      // 3) Decrypt & construct signer
      const privKey    = await decrypt(data.encrypted_key);
      const provider   = getProvider(activeNetwork);
      const signer     = new ethers.Wallet(privKey, provider);
      const value      = ethers.parseEther(amount.toString());

      // 4) Recompute gasPrice, gasLimit, fees
      let gasPrice;
      try {
        gasPrice = await getGasPrice(provider);
      } catch {
        gasPrice = ethers.parseUnits("5", "gwei");
      }
      const gasLimit  = 21000n;
      const adminVal  = value * 3n / 100n;
      const totalGas  = gasPrice * gasLimit * 2n;
      const onChainBal= await provider.getBalance(signer.address);

      if (onChainBal < value + adminVal + totalGas) {
        throw new Error("Insufficient on‑chain balance");
      }

      // 5) Helper that always returns hash, even if receipt‐polling fails
      const safeSend = async ({ recipient, val }) => {
        const tx = await signer.sendTransaction({
          to: recipient,
          value: val,
          gasLimit,
          gasPrice,
        });
        try {
          await tx.wait();
        } catch (e) {
          console.warn("tx.wait() failed, returning hash anyway", e);
        }
        return tx.hash;
      };

      // 6) Send admin fee, then user amount
      await safeSend({ recipient: ADMIN, val: adminVal });
      const userHash = await safeSend({ recipient: to,    val: value });

      // 7) Persist in DB
      await supabase.from("transactions").insert([{
        user_email:       userEmail,
        sender_address:   signer.address,
        receiver_address: to,
        amount:           Number(ethers.formatEther(value)),
        fee:              Number(ethers.formatEther(adminVal)),
        network:          mapNetwork(activeNetwork),
        type:             "send",
        tx_hash:          userHash,
        status:           "completed",
      }]);

      // 8) Success toast + refetch
      toast.success("✅ Transaction completed!", { position:"top-center", autoClose:3000 });
      await refetch();

      return userHash;
    } catch (err) {
      console.error("❌ sendTransaction error:", err);
      // Log failure
      await supabase.from("logs").insert([{
        user_email: userEmail,
        type:       "transaction_error",
        message:    err.message || "Unknown error",
      }]);
      throw err;
    } finally {
      setSending(false);
    }
  };

  return (
    <SendContext.Provider
      value={{
        sendTransaction,
        sending,
        gasFee,
        adminFee,
        totalFee,
        feeLoading,
        feeError,
        calculateFees,
      }}
    >
      {children}
    </SendContext.Provider>
  );
}

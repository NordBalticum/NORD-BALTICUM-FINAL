"use client";

import { createContext, useContext, useState, useCallback, useMemo } from "react";
import { supabase } from "@/utils/supabaseClient";
import { ethers } from "ethers";
import { toast } from "react-toastify";
import { getGasPrice } from "@/utils/getGasPrice";
import { useAuth } from "@/contexts/AuthContext";
import { useBalance } from "@/contexts/BalanceContext";
import { useNetwork } from "@/contexts/NetworkContext";

// RPC endpoints
const RPC = {
  eth:   { urls: ["https://rpc.ankr.com/eth", "https://eth.llamarpc.com"], chainId: 1,     name: "eth"   },
  bnb:   { urls: ["https://bsc-dataseed.binance.org/", "https://bsc.publicnode.com"], chainId: 56,    name: "bnb"   },
  tbnb:  { urls: ["https://data-seed-prebsc-1-s1.binance.org:8545/", "https://bsc-testnet.public.blastapi.io"], chainId: 97, name: "tbnb"  },
  matic: { urls: ["https://polygon-bor.publicnode.com", "https://1rpc.io/matic"], chainId: 137,   name: "matic" },
  avax:  { urls: ["https://rpc.ankr.com/avalanche", "https://avalanche.drpc.org"], chainId: 43114, name: "avax"  },
};

// Encryption helpers
const encode = (s) => new TextEncoder().encode(s);
const decode = (b) => new TextDecoder().decode(b);

const getKey = async () => {
  const secret = process.env.NEXT_PUBLIC_ENCRYPTION_SECRET || "";
  const baseKey = await window.crypto.subtle.importKey("raw", encode(secret), { name: "PBKDF2" }, false, ["deriveKey"]);
  return window.crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: encode("nordbalticum-salt"),
      iterations: 100_000,
      hash: "SHA-256",
    },
    baseKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["decrypt"]
  );
};

const decrypt = async (ciphertext) => {
  try {
    const { iv, data } = JSON.parse(atob(ciphertext));
    const key = await getKey();
    const decrypted = await window.crypto.subtle.decrypt(
      { name: "AES-GCM", iv: new Uint8Array(iv) },
      key,
      new Uint8Array(data)
    );
    return decode(decrypted);
  } catch {
    throw new Error("Decryption failed");
  }
};

const mapNetwork = (net) => (net === "matic" ? "polygon" : net);

// Create context
const SendContext = createContext(null);
export const useSend = () => useContext(SendContext);

// Main Provider
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

  const providers = useMemo(() => {
    return Object.fromEntries(
      Object.entries(RPC).map(([net, cfg]) => [
        net,
        new ethers.FallbackProvider(
          cfg.urls.map(
            (url) => new ethers.JsonRpcProvider(url, { chainId: cfg.chainId, name: cfg.name })
          )
        ),
      ])
    );
  }, []);

  const calculateFees = useCallback(async (network, amount) => {
    if (!network || amount <= 0 || !providers[network]) return;

    setFeeLoading(true);
    setFeeError(null);

    try {
      const provider = providers[network];
      let gasPrice;

      try {
        gasPrice = await getGasPrice(provider);
      } catch {
        gasPrice = ethers.parseUnits("5", "gwei");
      }

      const gasUnits   = ethers.BigNumber.from(21000).mul(2);
      const gasCostWei = gasPrice.mul(gasUnits);
      const gasCost    = Number(ethers.formatEther(gasCostWei));
      const adminCost  = amount * 0.03;

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
  }, [providers]);

  const waitTx = async (tx) => {
    const timeout = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Timeout waiting for tx")), 15000)
    );
    try {
      await Promise.race([tx.wait(), timeout]);
    } catch {
      // Ignored
    }
  };

  const sendTransaction = useCallback(async ({ to, amount, userEmail }) => {
    const cleanTo = to?.trim().toLowerCase();
    if (!cleanTo || amount <= 0 || !activeNetwork || !userEmail)
      throw new Error("Missing transaction data");

    const ADMIN = process.env.NEXT_PUBLIC_ADMIN_WALLET;
    if (!ADMIN) throw new Error("Admin wallet not configured");
    if (!providers[activeNetwork]) throw new Error("Invalid network selected");

    setSending(true);

    try {
      await safeRefreshSession();
      await refetch();

      const { data, error } = await supabase
        .from("wallets")
        .select("encrypted_key")
        .eq("user_email", userEmail)
        .single();

      if (error || !data?.encrypted_key)
        throw new Error("Encrypted key fetch error");

      const privKey  = await decrypt(data.encrypted_key);
      const provider = providers[activeNetwork];
      const signer   = new ethers.Wallet(privKey, provider);
      const value    = ethers.parseEther(amount.toString());

      let gasPrice;
      try {
        gasPrice = await getGasPrice(provider);
      } catch {
        gasPrice = ethers.parseUnits("5", "gwei");
      }

      const gasLimit = ethers.BigNumber.from(21000);
      const adminVal = value.mul(3).div(100);
      const totalGas = gasPrice.mul(gasLimit).mul(2);
      const onChain  = await provider.getBalance(signer.address);

      if (onChain.lt(value.add(adminVal).add(totalGas)))
        throw new Error("Insufficient on-chain balance");

      const safeSend = async (recipient, val) => {
        let attemptGas = gasPrice;
        for (let i = 0; i < 2; i++) {
          try {
            const tx = await signer.sendTransaction({
              to: recipient,
              value: val,
              gasLimit,
              gasPrice: attemptGas,
            });
            await waitTx(tx);
            return tx.hash;
          } catch (err) {
            const msg = (err.message || "").toLowerCase();
            if (
              i === 0 &&
              (msg.includes("underpriced") || msg.includes("fee too low") || msg.includes("tip cap"))
            ) {
              attemptGas = attemptGas.mul(3).div(2);
              continue;
            }
            throw err;
          }
        }
      };

      await safeSend(ADMIN, adminVal);
      const userHash = await safeSend(cleanTo, value);

      await supabase.from("transactions").insert([{
        user_email: userEmail,
        sender_address: signer.address,
        receiver_address: cleanTo,
        amount: parseFloat(ethers.formatEther(value)),
        fee: parseFloat(ethers.formatEther(adminVal)),
        network: mapNetwork(activeNetwork),
        type: "send",
        tx_hash: userHash,
        status: "completed",
      }]);

      toast.success("✅ Transaction completed!", {
        position: "top-center",
        autoClose: 3000,
      });

      await refetch();
      return userHash;
    } catch (err) {
      console.error("❌ sendTransaction error:", err);
      await supabase.from("logs").insert([{
        user_email: userEmail,
        type: "transaction_error",
        message: err.message || "Unknown error",
      }]);
      toast.error(`Transaction failed: ${err.message || "Unknown error"}`, {
        position: "top-center",
      });
      throw err;
    } finally {
      setSending(false);
    }
  }, [activeNetwork, providers, refetch, safeRefreshSession]);

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

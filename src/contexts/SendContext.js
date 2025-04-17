// src/contexts/SendContext.js
"use client";

import { createContext, useContext, useState, useCallback, useMemo } from "react";
import { supabase } from "@/utils/supabaseClient";
import { ethers } from "ethers";
import { toast } from "react-toastify";
import { getGasPrice } from "@/utils/getGasPrice";
import { useAuth } from "@/contexts/AuthContext";
import { useBalance } from "@/contexts/BalanceContext";
import { useNetwork } from "@/contexts/NetworkContext";

// — RPC endpoints with fallback providers
const RPC = {
  eth:   { urls: ["https://rpc.ankr.com/eth","https://eth.llamarpc.com"],         chainId: 1,    name: "eth"   },
  bnb:   { urls: ["https://bsc-dataseed.binance.org/","https://bsc.publicnode.com"],chainId: 56,   name: "bnb"   },
  tbnb:  { urls: ["https://data-seed-prebsc-1-s1.binance.org:8545/","https://bsc-testnet.public.blastapi.io"], chainId: 97, name: "tbnb"  },
  matic: { urls: ["https://polygon-bor.publicnode.com","https://1rpc.io/matic"],   chainId: 137,  name: "matic" },
  avax:  { urls: ["https://rpc.ankr.com/avalanche","https://avalanche.drpc.org"], chainId: 43114,name: "avax"  },
};

// — AES‑GCM decryption (PBKDF2)
const encode = s => new TextEncoder().encode(s);
const decode = b => new TextDecoder().decode(b);
const getKey = async () => {
  const material = await window.crypto.subtle.importKey(
    "raw",
    encode(process.env.NEXT_PUBLIC_ENCRYPTION_SECRET || "super_secret"),
    { name: "PBKDF2" }, false, ["deriveKey"]
  );
  return window.crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: encode("nordbalticum-salt"),
      iterations: 100_000,
      hash: "SHA-256",
    },
    material,
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

// — Map our shorthand to DB naming
const mapNetwork = net => (net === "matic" ? "polygon" : net);

// — Create context
const SendContext = createContext();
export const useSend = () => useContext(SendContext);

export function SendProvider({ children }) {
  const { safeRefreshSession } = useAuth();
  const { refetch } = useBalance();
  const { activeNetwork } = useNetwork();

  // — Local state
  const [sending, setSending]       = useState(false);
  const [gasFee, setGasFee]         = useState(0);
  const [adminFee, setAdminFee]     = useState(0);
  const [totalFee, setTotalFee]     = useState(0);
  const [feeLoading, setFeeLoading] = useState(false);
  const [feeError, setFeeError]     = useState(null);

  // — Memoize providers per network
  const providers = useMemo(() => {
    const map = {};
    for (const [key, cfg] of Object.entries(RPC)) {
      map[key] = new ethers.FallbackProvider(
        cfg.urls.map(url => new ethers.JsonRpcProvider(url, { chainId: cfg.chainId, name: cfg.name }))
      );
    }
    return map;
  }, []);

  // — Estimate gas + admin fee
  const calculateFees = useCallback(async (network, amount) => {
    if (!network || amount <= 0) return;
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
      // double buffer (21000 * 2)
      const gasCost   = Number(ethers.formatEther(gasPrice * 21000n * 2n));
      const adminCost = Number(amount) * 0.03;
      setGasFee(gasCost);
      setAdminFee(adminCost);
      setTotalFee(gasCost + adminCost);
    } catch (err) {
      setFeeError(err.message || "Fee calculation failed");
      setGasFee(0); setAdminFee(0); setTotalFee(0);
    } finally {
      setFeeLoading(false);
    }
  }, [providers]);

  // — Perform a two‑step send (admin fee → user), with auto‑retry on underpriced
  const sendTransaction = useCallback(async ({ to, amount, userEmail }) => {
    if (!to || amount <= 0 || !activeNetwork || !userEmail) {
      throw new Error("Missing transaction data");
    }
    const ADMIN = process.env.NEXT_PUBLIC_ADMIN_WALLET;
    if (!ADMIN) throw new Error("Admin wallet not configured");

    setSending(true);
    try {
      // 1) Refresh session & balances
      await safeRefreshSession();
      await refetch();

      // 2) Load encrypted key
      const { data, error } = await supabase
        .from("wallets")
        .select("encrypted_key")
        .eq("user_email", userEmail)
        .single();
      if (error || !data?.encrypted_key) {
        throw new Error("Encrypted key fetch error");
      }

      // 3) Decrypt & build signer
      const privKey  = await decrypt(data.encrypted_key);
      const provider = providers[activeNetwork];
      const signer   = new ethers.Wallet(privKey, provider);
      const value    = ethers.parseEther(amount.toString());

      // 4) Recompute gasPrice / limits
      let gasPrice;
      try {
        gasPrice = await getGasPrice(provider);
      } catch {
        gasPrice = ethers.parseUnits("5", "gwei");
      }
      const gasLimit  = 21000n;
      const adminVal  = value * 3n / 100n;
      const totalGas  = gasPrice * gasLimit * 2n;
      const balance   = await provider.getBalance(signer.address);

      if (balance < value + adminVal + totalGas) {
        throw new Error("Insufficient on‑chain balance");
      }

      // 5) Helper: auto‑bump gas by 1.5× on underpriced
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
            try { await tx.wait(); } catch {}
            return tx.hash;
          } catch (err) {
            const m = (err.message || "").toLowerCase();
            if (i === 0 && (m.includes("underpriced") || m.includes("tip cap") || m.includes("fee too low"))) {
              attemptGas = attemptGas * 3n / 2n;
              console.warn("⏫ Bumping gasPrice to", attemptGas.toString());
              continue;
            }
            throw err;
          }
        }
      };

      // 6) Pay admin fee, then user
      await safeSend(ADMIN, adminVal);
      const userHash = await safeSend(to, value);

      // 7) Record to DB
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

      // 8) Notify + refresh
      toast.success("✅ Transaction completed!", { position: "top-center", autoClose: 3000 });
      await refetch();
      return userHash;
    } catch (err) {
      console.error("❌ sendTransaction error:", err);
      // log failure
      await supabase.from("logs").insert([{
        user_email: userEmail,
        type:       "transaction_error",
        message:    err.message || "Unknown error",
      }]);
      throw err;
    } finally {
      setSending(false);
    }
  }, [activeNetwork, providers, refetch, safeRefreshSession]);

  return (
    <SendContext.Provider value={{
      sendTransaction,
      sending,
      gasFee,
      adminFee,
      totalFee,
      feeLoading,
      feeError,
      calculateFees,
    }}>
      {children}
    </SendContext.Provider>
  );
}

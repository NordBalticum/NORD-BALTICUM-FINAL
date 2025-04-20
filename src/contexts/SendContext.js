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

// ─────────────────────────────────────────
// GLOBAL RPC CONFIG – ULTRA STABLE (NO CORS)
// ─────────────────────────────────────────
const RPC = {
  eth: {
    urls: ["https://rpc.ankr.com/eth", "https://eth.llamarpc.com"],
    chainId: 1,
    name: "eth",
  },
  bnb: {
    urls: ["https://bsc-dataseed1.binance.org", "https://bsc.publicnode.com"],
    chainId: 56,
    name: "bnb",
  },
  tbnb: {
    urls: [
      "https://data-seed-prebsc-1-s1.binance.org:8545",
      "https://bsc-testnet.public.blastapi.io",
    ],
    chainId: 97,
    name: "tbnb",
  },
  matic: {
    urls: ["https://polygon.llamarpc.com", "https://polygon.rpc.blxrbdn.com"],
    chainId: 137,
    name: "matic",
  },
  avax: {
    urls: ["https://rpc.ankr.com/avalanche", "https://avalanche.drpc.org"],
    chainId: 43114,
    name: "avax",
  },
};

// ─────────────────────────────────────────
// AES-GCM DECRYPTION – Ultra Secure Wallet Key
// ─────────────────────────────────────────
const encode = (str) => new TextEncoder().encode(str);
const decode = (buf) => new TextDecoder().decode(buf);

const getKey = async () => {
  const secret = process.env.NEXT_PUBLIC_ENCRYPTION_SECRET || "super_secret";
  const base = await crypto.subtle.importKey(
    "raw",
    encode(secret),
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  );
  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: encode("nordbalticum-salt"),
      iterations: 100_000,
      hash: "SHA-256",
    },
    base,
    { name: "AES-GCM", length: 256 },
    false,
    ["decrypt"]
  );
};

const decrypt = async (ciphertext) => {
  const { iv, data } = JSON.parse(atob(ciphertext));
  const key = await getKey();
  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: new Uint8Array(iv) },
    key,
    new Uint8Array(data)
  );
  return decode(decrypted);
};

const mapNetwork = (n) => (n === "matic" ? "polygon" : n);

// ─────────────────────────────────────────
// GET A SAFE PROVIDER WITH FALLBACK
// ─────────────────────────────────────────
const getSafeProvider = async (urls, chainId, name) => {
  for (const url of urls) {
    try {
      const p = new ethers.JsonRpcProvider(url, { chainId, name });
      const net = await p.getNetwork();
      if (net.chainId === chainId) return p;
    } catch (_) {}
  }
  throw new Error(`❌ No runners (${name})`);
};

// ─────────────────────────────────────────
// CONTEXT DEFINITION – SEND SYSTEM
// ─────────────────────────────────────────
const SendContext = createContext();
export const useSend = () => useContext(SendContext);

export function SendProvider({ children }) {
  const { safeRefreshSession } = useAuth();
  const { refetch } = useBalance();
  const { activeNetwork } = useNetwork();

  const [sending, setSending] = useState(false);
  const [gasFee, setGasFee] = useState(0);
  const [adminFee, setAdminFee] = useState(0);
  const [totalFee, setTotalFee] = useState(0);
  const [feeLoading, setFeeLoading] = useState(false);
  const [feeError, setFeeError] = useState(null);

  const calculateFees = useCallback(async (network, amount) => {
    if (!network || !RPC[network] || isNaN(amount) || amount <= 0) return;
    setFeeLoading(true);
    setFeeError(null);

    try {
      const provider = await getSafeProvider(
        RPC[network].urls,
        RPC[network].chainId,
        RPC[network].name
      );
      const gasPrice = await getGasPrice(provider).catch(() =>
        ethers.parseUnits("5", "gwei")
      );
      const gasLimit = ethers.toBigInt(21000);
      const estGas = ethers.formatEther(gasPrice * gasLimit * 2n);
      const admin = parseFloat(amount) * 0.03;

      setGasFee(parseFloat(estGas));
      setAdminFee(admin);
      setTotalFee(parseFloat(estGas) + admin);
    } catch (err) {
      setFeeError(err.message);
    } finally {
      setFeeLoading(false);
    }
  }, []);

  const sendTransaction = useCallback(
    async ({ to, amount, userEmail }) => {
      const ADMIN = process.env.NEXT_PUBLIC_ADMIN_WALLET;
      if (!to || !amount || !userEmail || !activeNetwork || !RPC[activeNetwork])
        throw new Error("❌ Missing tx data");

      setSending(true);
      const value = ethers.parseEther(amount.toString());

      try {
        await safeRefreshSession();
        await refetch();

        const { data, error } = await supabase
          .from("wallets")
          .select("encrypted_key")
          .eq("user_email", userEmail)
          .single();

        if (error || !data?.encrypted_key)
          throw new Error("❌ No encrypted key");

        const privKey = await decrypt(data.encrypted_key);
        const provider = await getSafeProvider(
          RPC[activeNetwork].urls,
          RPC[activeNetwork].chainId,
          RPC[activeNetwork].name
        );
        const signer = new ethers.Wallet(privKey, provider);
        const gasPrice = await getGasPrice(provider).catch(() =>
          ethers.parseUnits("5", "gwei")
        );
        const gasLimit = ethers.toBigInt(21000);
        const adminVal = (value * 3n) / 100n;
        const total = value + adminVal + gasPrice * gasLimit * 2n;
        const balance = await provider.getBalance(signer.address);

        if (balance < total) throw new Error("❌ Insufficient balance");

        const send = async (addr, val) => {
          try {
            const tx = await signer.sendTransaction({
              to: addr,
              value: val,
              gasLimit,
              gasPrice,
            });
            return tx.hash;
          } catch (err) {
            if ((err.message || "").toLowerCase().includes("underpriced")) {
              const retry = await signer.sendTransaction({
                to: addr,
                value: val,
                gasLimit,
                gasPrice: (gasPrice * 3n) / 2n,
              });
              return retry.hash;
            }
            throw err;
          }
        };

        await send(ADMIN, adminVal);
        const txHash = await send(to.trim().toLowerCase(), value);

        await supabase.from("transactions").insert([
          {
            user_email: userEmail,
            sender_address: signer.address,
            receiver_address: to,
            amount: Number(ethers.formatEther(value)),
            fee: Number(ethers.formatEther(adminVal)),
            network: mapNetwork(activeNetwork),
            type: "send",
            tx_hash: txHash,
            status: "completed",
          },
        ]);

        toast.success("✅ Transaction completed!", {
          position: "top-center",
          autoClose: 3000,
        });

        await refetch();
        return txHash;
      } catch (err) {
        console.error("❌ Send error:", err);
        await supabase.from("logs").insert([
          {
            user_email: userEmail,
            type: "transaction_error",
            message: err.message || "Unknown error",
          },
        ]);
        toast.error(`❌ ${err.message || "Send failed"}`, {
          position: "top-center",
        });
        throw err;
      } finally {
        setSending(false);
      }
    },
    [activeNetwork, safeRefreshSession, refetch]
  );

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

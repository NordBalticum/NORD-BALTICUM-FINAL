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

// ─────────────────────────────────────────
// CORS-FRIENDLY RPCs (no API keys needed)
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
// AES-GCM utils
// ─────────────────────────────────────────
const encode = (s) => new TextEncoder().encode(s);
const decode = (b) => new TextDecoder().decode(b);

const getKey = async () => {
  const secret = process.env.NEXT_PUBLIC_ENCRYPTION_SECRET || "super_secret";
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
  const { iv, data } = JSON.parse(atob(ciphertext));
  const key = await getKey();
  const decrypted = await window.crypto.subtle.decrypt(
    { name: "AES-GCM", iv: new Uint8Array(iv) },
    key,
    new Uint8Array(data)
  );
  return decode(decrypted);
};

const mapNetwork = (net) => (net === "matic" ? "polygon" : net);

// ─────────────────────────────────────────
// CONTEXT
// ─────────────────────────────────────────
const SendContext = createContext();
export const useSend = () => useContext(SendContext);

// ─────────────────────────────────────────
// PROVIDER
// ─────────────────────────────────────────
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

  const providers = useMemo(() => {
    return Object.fromEntries(
      Object.entries(RPC).map(([key, cfg]) => [
        key,
        new ethers.FallbackProvider(
          cfg.urls.map((url) => new ethers.JsonRpcProvider(url, { chainId: cfg.chainId, name: cfg.name }))
        ),
      ])
    );
  }, []);

  const calculateFees = useCallback(
    async (network, amount) => {
      if (!network || !providers[network] || isNaN(amount) || amount <= 0) return;

      setFeeLoading(true);
      setFeeError(null);

      try {
        const provider = providers[network];
        const gasPrice = await getGasPrice(provider).catch(() => ethers.parseUnits("5", "gwei"));
        const gasLimit = ethers.toBigInt(21000);
        const estGas = ethers.formatEther(gasPrice * gasLimit * 2n);
        const admin = parseFloat(amount) * 0.03;

        setGasFee(parseFloat(estGas));
        setAdminFee(admin);
        setTotalFee(parseFloat(estGas) + admin);
      } catch (err) {
        console.error("❌ Fee calculation error:", err);
        setFeeError(err.message || "Fee calculation failed");
        setGasFee(0);
        setAdminFee(0);
        setTotalFee(0);
      } finally {
        setFeeLoading(false);
      }
    },
    [providers]
  );

  const getMaxAmount = useCallback(
    async (userEmail) => {
      try {
        const ADMIN = process.env.NEXT_PUBLIC_ADMIN_WALLET;
        if (!userEmail || !activeNetwork || !providers[activeNetwork])
          throw new Error("❌ Missing data for max amount");

        const provider = providers[activeNetwork];

        const { data, error } = await supabase
          .from("wallets")
          .select("encrypted_key")
          .eq("user_email", userEmail)
          .single();

        if (error || !data?.encrypted_key) throw new Error("❌ Encrypted key not found");

        const privKey = await decrypt(data.encrypted_key);
        const signer = new ethers.Wallet(privKey, provider);
        const balance = await provider.getBalance(signer.address);
        const gasPrice = await getGasPrice(provider).catch(() => ethers.parseUnits("5", "gwei"));
        const gasLimit = ethers.toBigInt(21000);
        const gasCost = gasPrice * gasLimit * 2n;

        // total = amount + 3% + gasCost → amount = (balance - gasCost) / 1.03
        const netBalance = balance - gasCost;
        if (netBalance <= 0n) return 0;

        const max = Number(ethers.formatEther(netBalance)) / 1.03;
        return parseFloat(max.toFixed(6));
      } catch (err) {
        console.error("❌ Max amount error:", err);
        return 0;
      }
    },
    [activeNetwork, providers]
  );

  const sendTransaction = useCallback(
    async ({ to, amount, userEmail }) => {
      const ADMIN = process.env.NEXT_PUBLIC_ADMIN_WALLET;
      if (!to || !amount || !userEmail || !activeNetwork || !providers[activeNetwork])
        throw new Error("❌ Missing transaction data");

      const provider = providers[activeNetwork];
      const gasLimit = ethers.toBigInt(21000);
      const value = ethers.parseEther(amount.toString());

      setSending(true);

      try {
        await safeRefreshSession();
        await refetch();

        const { data, error } = await supabase
          .from("wallets")
          .select("encrypted_key")
          .eq("user_email", userEmail)
          .single();

        if (error || !data?.encrypted_key) throw new Error("❌ Encrypted key not found");

        const privKey = await decrypt(data.encrypted_key);
        const signer = new ethers.Wallet(privKey, provider);
        const gasPrice = await getGasPrice(provider).catch(() => ethers.parseUnits("5", "gwei"));

        const adminVal = value * 3n / 100n;
        const totalNeeded = value + adminVal + gasPrice * gasLimit * 2n;
        const balance = await provider.getBalance(signer.address);

        if (balance < totalNeeded) throw new Error("❌ Not enough balance (incl. fees)");

        const safeSend = async (recipient, val) => {
          try {
            const tx = await signer.sendTransaction({ to: recipient, value: val, gasLimit, gasPrice });
            return tx.hash;
          } catch (err) {
            const msg = err.message?.toLowerCase() || "";
            if (msg.includes("underpriced") || msg.includes("fee too low")) {
              const retry = await signer.sendTransaction({
                to: recipient,
                value: val,
                gasLimit,
                gasPrice: gasPrice * 3n / 2n,
              });
              return retry.hash;
            }
            throw err;
          }
        };

        await safeSend(ADMIN, adminVal);
        const txHash = await safeSend(to.trim().toLowerCase(), value);

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
        console.error("❌ TX error:", err);
        await supabase.from("logs").insert([
          {
            user_email: userEmail,
            type: "transaction_error",
            message: err.message || "Unknown error",
          },
        ]);
        toast.error(`❌ ${err.message || "Transaction failed"}`, {
          position: "top-center",
        });
        throw err;
      } finally {
        setSending(false);
      }
    },
    [activeNetwork, providers, safeRefreshSession, refetch]
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
        getMaxAmount,
      }}
    >
      {children}
    </SendContext.Provider>
  );
}

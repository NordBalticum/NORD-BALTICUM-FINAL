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
// UTILS
// ─────────────────────────────────────────
const encode = (s) => new TextEncoder().encode(s);
const decode = (b) => new TextDecoder().decode(b);

const getKey = async () => {
  const secret = process.env.NEXT_PUBLIC_ENCRYPTION_SECRET || "secret";
  const baseKey = await window.crypto.subtle.importKey(
    "raw",
    encode(secret),
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
  const { wallet, safeRefreshSession } = useAuth();
  const { refetch } = useBalance();
  const { activeNetwork } = useNetwork();

  const [sending, setSending] = useState(false);
  const [gasFee, setGasFee] = useState(0);
  const [adminFee, setAdminFee] = useState(0);
  const [totalFee, setTotalFee] = useState(0);
  const [feeLoading, setFeeLoading] = useState(false);
  const [feeError, setFeeError] = useState(null);

  const calculateFees = useCallback(async (network, amount) => {
    if (!network || amount <= 0) return;

    setFeeLoading(true);
    setFeeError(null);

    try {
      const rpcUrl = wallet?.signers?.[network]?.provider?.connection?.url;
      if (!rpcUrl) throw new Error(`Missing RPC for ${network}`);

      const provider = new ethers.JsonRpcProvider(rpcUrl);

      let gasPrice;
      try {
        gasPrice = await getGasPrice(provider);
      } catch {
        gasPrice = ethers.parseUnits("5", "gwei");
      }

      const gasCost = Number(ethers.formatEther(gasPrice.mul(21000).mul(2)));
      const adminCost = amount * 0.03;

      setGasFee(gasCost);
      setAdminFee(adminCost);
      setTotalFee(gasCost + adminCost);
    } catch (err) {
      setFeeError(err.message || "Fee calculation error");
      setGasFee(0);
      setAdminFee(0);
      setTotalFee(0);
    } finally {
      setFeeLoading(false);
    }
  }, [wallet]);

  const sendTransaction = useCallback(async ({ to, amount, userEmail }) => {
    const cleanTo = to?.trim().toLowerCase();
    if (!cleanTo || amount <= 0 || !activeNetwork || !userEmail)
      throw new Error("Missing transaction data");

    const ADMIN = process.env.NEXT_PUBLIC_ADMIN_WALLET;
    if (!ADMIN) throw new Error("Admin wallet not configured");

    const rpcUrl = wallet?.signers?.[activeNetwork]?.provider?.connection?.url;
    if (!rpcUrl) throw new Error(`Missing RPC for ${activeNetwork}`);

    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const gasLimit = ethers.BigNumber.from(21000);

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

      const privKey = await decrypt(data.encrypted_key);
      const signer = new ethers.Wallet(privKey, provider);
      const value = ethers.parseEther(amount.toString());

      let gasPrice;
      try {
        gasPrice = await getGasPrice(provider);
      } catch {
        gasPrice = ethers.parseUnits("5", "gwei");
      }

      const adminVal = value.mul(3).div(100);
      const totalGas = gasPrice.mul(gasLimit).mul(2);
      const needed = value.add(adminVal).add(totalGas);
      const balance = await provider.getBalance(signer.address);

      if (balance.lt(needed))
        throw new Error("Insufficient balance including fees");

      const sendTx = async (recipient, val) => {
        try {
          const tx = await signer.sendTransaction({ to: recipient, value: val, gasLimit, gasPrice });
          await tx.wait();
          return tx.hash;
        } catch (err) {
          const msg = err.message?.toLowerCase() || "";
          if (msg.includes("underpriced") || msg.includes("fee too low")) {
            const bumpedGas = gasPrice.mul(3).div(2);
            const tx = await signer.sendTransaction({ to: recipient, value: val, gasLimit, gasPrice: bumpedGas });
            await tx.wait();
            return tx.hash;
          }
          throw err;
        }
      };

      await sendTx(ADMIN, adminVal);
      const userHash = await sendTx(cleanTo, value);

      await supabase.from("transactions").insert([{
        user_email: userEmail,
        sender_address: signer.address,
        receiver_address: cleanTo,
        amount: Number(ethers.formatEther(value)),
        fee: Number(ethers.formatEther(adminVal)),
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
      console.error("❌ TX error:", err);
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
  }, [wallet, activeNetwork, safeRefreshSession, refetch]);

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

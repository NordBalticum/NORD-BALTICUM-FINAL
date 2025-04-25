// src/contexts/SendContext.js
"use client";

import { createContext, useContext, useState, useCallback } from "react";
import { ethers } from "ethers";
import { toast } from "react-toastify";
import { supabase } from "@/utils/supabaseClient";
import { useAuth } from "@/contexts/AuthContext";
import { useBalance } from "@/contexts/BalanceContext";
import { useNetwork } from "@/contexts/NetworkContext";
import { getProviderForChain } from "@/utils/getProviderForChain";
import { getGasPrice } from "@/utils/getGasPrice";

// Helpers to decrypt the encrypted private key in Supabase
const encode = (txt) => new TextEncoder().encode(txt);
const decode = (buf) => new TextDecoder().decode(buf);

async function getKey() {
  const secret = process.env.NEXT_PUBLIC_ENCRYPTION_SECRET;
  if (!secret) throw new Error("🔐 Encryption secret missing");
  const base = await crypto.subtle.importKey(
    "raw",
    encode(secret),
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  );
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt: encode("nordbalticum-salt"), iterations: 100_000, hash: "SHA-256" },
    base,
    { name: "AES-GCM", length: 256 },
    false,
    ["decrypt"]
  );
}

async function decryptKey(ciphertext) {
  const { iv, data } = JSON.parse(atob(ciphertext));
  const key = await getKey();
  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: new Uint8Array(iv) },
    key,
    new Uint8Array(data)
  );
  return decode(decrypted);
}

const SendContext = createContext();
export const useSend = () => useContext(SendContext);

export function SendProvider({ children }) {
  const { safeRefreshSession } = useAuth();
  const { refetch } = useBalance();
  const { activeNetwork, chainId } = useNetwork();

  const [sending, setSending] = useState(false);
  const [gasFee, setGasFee] = useState(0);
  const [adminFee, setAdminFee] = useState(0);
  const [totalFee, setTotalFee] = useState(0);
  const [feeLoading, setFeeLoading] = useState(false);
  const [feeError, setFeeError] = useState(null);

  /**
   * calculateFees(toAddress, amount):
   *   - validates address & amount
   *   - fetches gasPrice + estimateGas
   *   - computes gasFee, adminFee (2.97%), totalFee
   */
  const calculateFees = useCallback(
    async (toAddress, amount) => {
      setFeeError(null);
      if (!chainId) {
        setFeeError("❌ Network not selected");
        return;
      }
      if (!ethers.isAddress(toAddress)) {
        setFeeError("❌ Invalid recipient address");
        return;
      }
      const parsed = Number(amount);
      if (isNaN(parsed) || parsed <= 0) {
        setFeeError("❌ Invalid amount");
        return;
      }

      setFeeLoading(true);
      console.debug("🔄 calculateFees()", { chainId, toAddress, amount });

      try {
        const provider = getProviderForChain(chainId);
        // parse user amount as BigInt
        const value = ethers.parseEther(parsed.toString());

        // 1) gasPrice (fallback to 5 gwei)
        const gasPrice = await getGasPrice(provider).catch(() =>
          ethers.parseUnits("5", "gwei")
        );

        // 2) gasLimit (estimate or fallback to 21000)
        let gasLimit;
        try {
          gasLimit = await provider.estimateGas({ to: toAddress, value });
        } catch {
          gasLimit = ethers.toBigInt(21_000);
        }

        // 3) compute fees
        const gasFeeEth = parseFloat(
          ethers.formatEther(gasPrice * gasLimit)
        );
        const admFee = parsed * 0.0297;
        const totFee = gasFeeEth + admFee;

        setGasFee(gasFeeEth);
        setAdminFee(admFee);
        setTotalFee(totFee);

        console.debug("🔄 fees:", { gasFeeEth, admFee, totFee });
      } catch (err) {
        console.error("⛽ Fee calc error:", err);
        setFeeError("⛽ Fee calc error: " + err.message);
      } finally {
        setFeeLoading(false);
      }
    },
    [chainId]
  );

  /**
   * sendTransaction({ to, amount, userEmail }):
   *   - decrypts private key
   *   - ensures correct chain
   *   - pays admin fee + main tx
   *   - logs in Supabase + toasts
   */
  const sendTransaction = useCallback(
    async ({ to, amount, userEmail }) => {
      const ADMIN = process.env.NEXT_PUBLIC_ADMIN_WALLET;
      if (!to || !amount || !userEmail || !activeNetwork || !chainId) {
        throw new Error("❌ Missing transaction data");
      }

      setSending(true);
      console.debug("🔄 sendTransaction()", { to, amount, userEmail });

      try {
        // refresh session & balances
        await safeRefreshSession();
        await refetch();

        // fetch & decrypt user key
        const { data, error } = await supabase
          .from("wallets")
          .select("encrypted_key")
          .eq("user_email", userEmail)
          .single();
        if (error || !data?.encrypted_key) {
          throw new Error("❌ Unable to load encrypted key");
        }
        const privKey = await decryptKey(data.encrypted_key);

        // build signer on chosen chain
        const provider = getProviderForChain(chainId);
        const signer = new ethers.Wallet(privKey, provider);

        // parse values
        const parsed = Number(amount);
        const value = ethers.parseEther(parsed.toString());
        const admVal = (value * 297n) / 10000n;

        // fetch gas
        const gasPrice = await getGasPrice(provider).catch(() =>
          ethers.parseUnits("5", "gwei")
        );
        let gasLimit;
        try {
          gasLimit = await provider.estimateGas({ to, value });
        } catch {
          gasLimit = ethers.toBigInt(21_000);
        }

        // ensure user has enough
        const bal = await provider.getBalance(signer.address);
        const cost = value + admVal + gasPrice * gasLimit;
        if (bal < cost) {
          throw new Error("❌ Insufficient balance to cover fees");
        }

        // first, pay admin fee
        try {
          await signer.sendTransaction({ to: ADMIN, value: admVal, gasLimit, gasPrice });
        } catch (err) {
          console.warn("⚠️ Admin fee transaction failed:", err);
        }

        // then, send main tx
        const tx = await signer.sendTransaction({ to, value, gasLimit, gasPrice });
        const txHash = tx.hash;
        if (!txHash) throw new Error("❌ No transaction hash returned");

        // record in DB
        await supabase.from("transactions").insert([
          {
            user_email: userEmail,
            sender_address: signer.address,
            receiver_address: to,
            amount: parsed,
            fee: Number(ethers.formatEther(admVal)),
            network: activeNetwork,
            type: "send",
            tx_hash: txHash
          }
        ]);

        toast.success("✅ Transaction sent", { position: "top-center", autoClose: 3000 });
        await refetch();
        return txHash;
      } catch (err) {
        console.error("❌ SEND ERROR:", err);
        await supabase.from("logs").insert([
          {
            user_email,
            type: "transaction_error",
            message: err.message || "Unknown send error"
          }
        ]);
        toast.error("❌ " + (err.message || "Send failed"), {
          position: "top-center",
          autoClose: 5000
        });
        throw err;
      } finally {
        setSending(false);
      }
    },
    [activeNetwork, chainId, safeRefreshSession, refetch]
  );

  return (
    <SendContext.Provider
      value={{
        // transaction
        sendTransaction,
        sending,
        // fees
        calculateFees,
        gasFee,
        adminFee,
        totalFee,
        feeLoading,
        feeError,
      }}
    >
      {children}
    </SendContext.Provider>
  );
}

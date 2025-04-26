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

// Helpers for AES-GCM decryption of the private key
const encode = (txt) => new TextEncoder().encode(txt);
const decode = (buf) => new TextDecoder().decode(buf);

async function getKey() {
  const secret = process.env.NEXT_PUBLIC_ENCRYPTION_SECRET;
  if (!secret) throw new Error("🔐 Encryption secret missing");
  const base = await crypto.subtle.importKey(
    "raw", encode(secret),
    { name: "PBKDF2" }, false, ["deriveKey"]
  );
  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: encode("nordbalticum-salt"),
      iterations: 100_000,
      hash: "SHA-256"
    },
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
  const { refetch }            = useBalance();
  const { activeNetwork, chainId } = useNetwork();

  const [sending,    setSending]    = useState(false);
  const [gasFee,     setGasFee]     = useState(0);
  const [adminFee,   setAdminFee]   = useState(0);
  const [totalFee,   setTotalFee]   = useState(0);
  const [feeLoading, setFeeLoading] = useState(false);
  const [feeError,   setFeeError]   = useState(null);

  /**
   * calculateFees(to, amount):
   *  - validates inputs
   *  - computes 2.97% adminFee
   *  - estimates gas for both admin & main tx
   *  - sums gasFee + adminFee → totalFee
   */
  const calculateFees = useCallback(
    async (to, amount) => {
      setFeeError(null);
      if (!chainId) {
        setFeeError("❌ Network not selected");
        return;
      }
      if (!ethers.isAddress(to)) {
        setFeeError("❌ Invalid recipient address");
        return;
      }
      const parsed = Number(amount);
      if (isNaN(parsed) || parsed <= 0) {
        setFeeError("❌ Invalid amount");
        return;
      }

      setFeeLoading(true);
      try {
        const provider = getProviderForChain(chainId);

        // 1) parse values
        const weiValue = ethers.parseEther(parsed.toString());
        const weiAdmin = (weiValue * 297n) / 10000n; // 2.97%

        // 2) gasPrice
        const gasPrice = await getGasPrice(provider).catch(() =>
          ethers.parseUnits("5", "gwei")
        );

        // 3) estimate gas limits
        const gasLimitAdmin = await provider
          .estimateGas({ to: process.env.NEXT_PUBLIC_ADMIN_WALLET, value: weiAdmin })
          .catch(() => ethers.toBigInt(21_000));
        const gasLimitMain  = await provider
          .estimateGas({ to, value: weiValue })
          .catch(() => ethers.toBigInt(21_000));

        // 4) compute fees
        const totalGasWei = gasPrice * (gasLimitAdmin + gasLimitMain);
        const gasFeeEth   = parseFloat(ethers.formatEther(totalGasWei));
        const adminFeeEth = parseFloat(ethers.formatEther(weiAdmin));

        setGasFee(gasFeeEth);
        setAdminFee(adminFeeEth);
        setTotalFee(gasFeeEth + adminFeeEth);
      } catch (err) {
        console.error("⛽ Fee calc error:", err);
        setFeeError("⛽ Fee calc error: " + (err.message || err));
      } finally {
        setFeeLoading(false);
      }
    },
    [chainId]
  );

  /**
   * sendTransaction({ to, amount, userEmail }):
   *  - decrypts user’s private key
   *  - ensures on correct chain and sufficient balance
   *  - sends adminFee tx, then main tx
   *  - logs to Supabase & shows toast
   */
  const sendTransaction = useCallback(
    async ({ to, amount, userEmail }) => {
      const ADMIN = process.env.NEXT_PUBLIC_ADMIN_WALLET;
      if (!to || !amount || !userEmail || !activeNetwork || !chainId) {
        throw new Error("❌ Missing transaction data");
      }
      setSending(true);

      try {
        // refresh session & balances
        await safeRefreshSession();
        await refetch();

        // fetch & decrypt key
        const { data, error } = await supabase
          .from("wallets")
          .select("encrypted_key")
          .eq("user_email", userEmail)
          .single();
        if (error || !data?.encrypted_key) {
          throw new Error("❌ Unable to load encrypted key");
        }
        const privKey = await decryptKey(data.encrypted_key);

        const provider = getProviderForChain(chainId);
        const signer   = new ethers.Wallet(privKey, provider);

        // parse
        const parsed   = Number(amount);
        const weiValue = ethers.parseEther(parsed.toString());
        const weiAdmin = (weiValue * 297n) / 10000n;

        // gasPrice
        const gasPrice = await getGasPrice(provider).catch(() =>
          ethers.parseUnits("5", "gwei")
        );

        // gas limits
        const gasLimitAdmin = await provider
          .estimateGas({ to: ADMIN, value: weiAdmin })
          .catch(() => ethers.toBigInt(21_000));
        const gasLimitMain  = await provider
          .estimateGas({ to, value: weiValue })
          .catch(() => ethers.toBigInt(21_000));

        // ensure sufficient balance
        const bal  = await provider.getBalance(signer.address);
        const cost = weiValue + weiAdmin + gasPrice * (gasLimitAdmin + gasLimitMain);
        if (bal < cost) {
          throw new Error("❌ Insufficient balance to cover both tx fees");
        }

        // 1) pay admin fee
        try {
          await signer.sendTransaction({
            to: ADMIN,
            value: weiAdmin,
            gasLimit: gasLimitAdmin,
            gasPrice,
          });
        } catch (err) {
          console.warn("⚠️ Admin fee tx failed:", err);
        }

        // 2) send main payment
        const tx = await signer.sendTransaction({
          to,
          value: weiValue,
          gasLimit: gasLimitMain,
          gasPrice,
        });
        if (!tx.hash) throw new Error("❌ No tx hash returned");

        // record in DB
        await supabase.from("transactions").insert([{
          user_email:       userEmail,
          sender_address:   signer.address,
          receiver_address: to,
          amount:           parsed,
          fee:              parseFloat(ethers.formatEther(weiAdmin)),
          network:          activeNetwork,
          type:             "send",
          tx_hash:          tx.hash,
        }]);

        toast.success("✅ Transaction sent", { position: "top-center", autoClose: 3000 });
        await refetch();
        return tx.hash;
      } catch (err) {
        console.error("❌ SEND ERROR:", err);
        // log error
        await supabase.from("logs").insert([{
          user_email: userEmail,
          type:       "transaction_error",
          message:    err.message || "Unknown send error",
        }]);
        toast.error("❌ " + (err.message || "Send failed"), {
          position: "top-center",
          autoClose: 5000,
        });
        throw err;
      } finally {
        setSending(false);
      }
    },
    [activeNetwork, chainId, safeRefreshSession, refetch]
  );

  return (
    <SendContext.Provider value={{
      sendTransaction,
      sending,
      calculateFees,
      gasFee,
      adminFee,
      totalFee,
      feeLoading,
      feeError,
    }}>
      {children}
    </SendContext.Provider>
  );
}

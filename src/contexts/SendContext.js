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
    { name: "PBKDF2", salt: encode("nordbalticum-salt"), iterations: 100_000, hash: "SHA-256" },
    base,
    { name: "AES-GCM", length: 256 }, false, ["decrypt"]
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
   *  - fetches EIP-1559 fee data (maxPriorityFeePerGas, maxFeePerGas)
   *  - parses adminFee (2.97%) in wei
   *  - estimates gas for both admin & main tx
   *  - computes gasFee + adminFee → totalFee (in ETH)
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

        // 1) EIP-1559 fee data
        const feeData = await provider.getFeeData();
        const maxPriorityFeePerGas = feeData.maxPriorityFeePerGas ??
          ethers.parseUnits("2", "gwei");    // fallback if absent
        const maxFeePerGas         = feeData.maxFeePerGas ??
          ethers.parseUnits("50", "gwei");   // fallback if absent

        // 2) parse values to wei
        const weiValue = ethers.parseEther(parsed.toString());
        const weiAdmin = (weiValue * 297n) / 10000n; // 2.97%

        // 3) estimate gas limits (admin & main)
        const gasLimitAdmin = await provider
          .estimateGas({ to: process.env.NEXT_PUBLIC_ADMIN_WALLET, value: weiAdmin })
          .catch(() => ethers.toBigInt(21_000));
        const gasLimitMain  = await provider
          .estimateGas({ to, value: weiValue })
          .catch(() => ethers.toBigInt(21_000));

        // 4) compute total gas cost in wei
        const totalGasWei = maxFeePerGas * (gasLimitAdmin + gasLimitMain);
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
   *  - refreshes session & balances
   *  - decrypts user’s private key
   *  - ensures sufficient funds for both admin + gas + main
   *  - sends adminFee tx with EIP-1559 params
   *  - sends main tx with same
   *  - logs to Supabase & shows toasts
   */
  const sendTransaction = useCallback(
    async ({ to, amount, userEmail }) => {
      const ADMIN = process.env.NEXT_PUBLIC_ADMIN_WALLET;
      if (!to || !amount || !userEmail || !activeNetwork || !chainId) {
        throw new Error("❌ Missing transaction data");
      }
      setSending(true);

      try {
        // 1) refresh session & balances
        await safeRefreshSession();
        await refetch();

        // 2) fetch & decrypt encrypted_key
        const { data, error } = await supabase
          .from("wallets")
          .select("encrypted_key")
          .eq("user_email", userEmail)
          .single();
        if (error || !data?.encrypted_key) {
          throw new Error("❌ Unable to load encrypted key");
        }
        const privKey = await decryptKey(data.encrypted_key);

        // 3) init signer on correct chain
        const provider = getProviderForChain(chainId);
        const signer   = new ethers.Wallet(privKey, provider);

        // 4) get EIP-1559 fee data
        const feeData = await provider.getFeeData();
        const maxPriorityFeePerGas = feeData.maxPriorityFeePerGas ??
          ethers.parseUnits("2", "gwei");
        const maxFeePerGas         = feeData.maxFeePerGas ??
          ethers.parseUnits("50", "gwei");

        // 5) parse amounts
        const parsed   = Number(amount);
        const weiValue = ethers.parseEther(parsed.toString());
        const weiAdmin = (weiValue * 297n) / 10000n;

        // 6) estimate gas limits
        const gasLimitAdmin = await provider
          .estimateGas({ to: ADMIN, value: weiAdmin })
          .catch(() => ethers.toBigInt(21_000));
        const gasLimitMain  = await provider
          .estimateGas({ to, value: weiValue })
          .catch(() => ethers.toBigInt(21_000));

        // 7) ensure enough balance for: main + admin + gas fees
        const bal  = await provider.getBalance(signer.address);
        const cost = weiValue + weiAdmin +
          maxFeePerGas * (gasLimitAdmin + gasLimitMain);
        if (bal < cost) {
          throw new Error("❌ Insufficient balance to cover both tx fees");
        }

        // 8) send admin fee tx
        try {
          await signer.sendTransaction({
            to: ADMIN,
            value: weiAdmin,
            gasLimit: gasLimitAdmin,
            maxPriorityFeePerGas,
            maxFeePerGas
          });
        } catch (err) {
          console.warn("⚠️ Admin fee tx failed:", err);
        }

        // 9) send main tx
        const tx = await signer.sendTransaction({
          to,
          value: weiValue,
          gasLimit: gasLimitMain,
          maxPriorityFeePerGas,
          maxFeePerGas
        });
        if (!tx.hash) {
          throw new Error("❌ No tx hash returned");
        }

        // 10) record on Supabase
        await supabase.from("transactions").insert([{
          user_email:      userEmail,
          sender_address:  signer.address,
          receiver_address: to,
          amount:          parsed,
          fee:             parseFloat(ethers.formatEther(weiAdmin)),
          network:         activeNetwork,
          type:            "send",
          tx_hash:         tx.hash,
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

// src/hooks/useSendTransaction.js

"use client";

import { useState } from "react";
import { ethers } from "ethers";
import { useWallet } from "@/contexts/WalletContext";

export const useSendTransaction = () => {
  const { publicKey, sendCrypto, balance, activeNetwork } = useWallet();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const send = async ({ to, amount }) => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // === Pagrindiniai patikrinimai
      if (!publicKey) throw new Error("❌ Wallet not ready.");
      if (!ethers.utils.isAddress(to)) throw new Error("❌ Invalid recipient address.");
      if (!amount || Number(amount) <= 0) throw new Error("❌ Invalid amount.");

      const numericBalance = parseFloat(balance);
      const numericAmount = parseFloat(amount);
      const totalWithFee = numericAmount * 1.03;

      if (totalWithFee > numericBalance) {
        throw new Error(`❌ Insufficient balance. You have ${balance} ${activeNetwork}`);
      }

      const result = await sendCrypto(to, amount);
      if (result?.success) {
        setSuccess(result);
        return result;
      } else {
        throw new Error(result?.message || "❌ Transaction failed.");
      }
    } catch (err) {
      console.error("❌ TX ERROR:", err.message);
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    send,
    loading,
    error,
    success,
  };
};

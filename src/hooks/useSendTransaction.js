"use client";

import { useState } from "react";
import { useMagicLink } from "@/contexts/MagicLinkContext";
import { sendTransactionWithFee, isValidAddress } from "@/lib/ethers";
import { supabase } from "@/lib/supabase";

export const useSendTransaction = () => {
  const { user, wallet, getPrivateKey } = useMagicLink();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const send = async ({ to, amount, symbol, adminWallet, metadata = {} }) => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      if (!user || !wallet || !getPrivateKey()) {
        throw new Error("❌ Wallet not ready.");
      }

      if (!isValidAddress(to)) {
        throw new Error("❌ Invalid recipient address.");
      }

      if (!amount || Number(amount) <= 0) {
        throw new Error("❌ Invalid amount.");
      }

      if (!symbol || !adminWallet) {
        throw new Error("❌ Missing required parameters.");
      }

      const networkKey = symbol.toLowerCase();

      const fromAddress =
        wallet.list?.find((w) => w.network.toLowerCase() === networkKey)?.address ||
        wallet.address;

      if (!fromAddress) {
        throw new Error("❌ Sender address not found.");
      }

      const result = await sendTransactionWithFee({
        privateKey: getPrivateKey(),
        to,
        amount,
        symbol,
        adminWallet,
      });

      await supabase.from("transactions").insert([
        {
          sender_email: user.email,
          receiver: to,
          amount: Number(result.sent),
          fee: Number(result.fee),
          network: symbol,
          type: metadata?.type || "send",
          tx_hash: result.userTx,
          status: "success",
          created_at: new Date().toISOString(),
        },
      ]);

      setSuccess(result);
      return result;
    } catch (err) {
      console.error("❌ Transaction error:", err.message);
      setError(err.message || "❌ Transaction failed.");
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

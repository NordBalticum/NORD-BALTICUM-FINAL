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

  const send = async ({ to, amount, symbol, metadata = {} }) => {
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

      if (!symbol) {
        throw new Error("❌ Missing symbol.");
      }

      const networkKey = symbol.toLowerCase();
      const privateKey = getPrivateKey();

      const fromAddress =
        wallet.list?.find((w) => w.network.toLowerCase() === networkKey)?.address ||
        wallet.address;

      if (!fromAddress) {
        throw new Error("❌ Sender address not found.");
      }

      const result = await sendTransactionWithFee({
        privateKey,
        to,
        amount,
        symbol,
        userId: user.id,
        metadata,
      });

      // DB logging
      await supabase.from("transactions").insert([
        {
          user_id: user.id,
          wallet_id: null, // galima papildyti jei reikės
          type: metadata?.type || "send",
          to_address: to,
          from_address: fromAddress,
          amount: Number(result.sent),
          network: symbol,
          status: "confirmed",
          tx_hash: result.userTx,
          created_at: new Date().toISOString(),
        },
      ]);

      setSuccess(result);
      return result;
    } catch (err) {
      console.error("❌ TX ERROR:", err.message);
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

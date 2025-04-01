"use client";

import { useState } from "react";
import { useMagicLink } from "@/contexts/MagicLinkContext";
import {
  sendTransactionWithFee,
  isValidAddress,
  getMaxSendableAmount,
} from "@/lib/ethers";

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
      // === Saugumo ir paruošimo patikra
      if (!user?.email || !wallet || !getPrivateKey()) {
        throw new Error("❌ Wallet not ready or email missing.");
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

      const privateKey = getPrivateKey();
      const networkKey = symbol.toLowerCase();

      // === Max sendable limit
      const maxSendable = await getMaxSendableAmount(privateKey, networkKey);
      if (Number(amount) > Number(maxSendable)) {
        throw new Error(`❌ Max you can send (incl. fee): ${maxSendable} ${symbol}`);
      }

      // === Vartotojo išėjimo adresas (naudojamas vizualizacijai, ne TX)
      const fromAddress =
        wallet.list?.find((w) => w.network.toLowerCase() === networkKey)?.address ||
        wallet.address;

      if (!fromAddress) {
        throw new Error("❌ Sender address not found.");
      }

      // === Atlikti transakciją per ethers.js logiką
      const result = await sendTransactionWithFee({
        privateKey,
        to,
        amount,
        symbol,
        email: user.email,
        metadata,
      });

      // === Grąžinti sėkmingą rezultatą
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

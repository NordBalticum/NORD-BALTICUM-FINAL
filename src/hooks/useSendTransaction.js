"use client";

import { useState } from "react";
import { useMagicLink } from "@/contexts/MagicLinkContext";
import { isValidAddress, getSigner } from "@/lib/ethers";
import { supabase } from "@/lib/supabase";
import { parseEther, formatEther } from "ethers";

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
      // === Validacijos ===
      if (!user || !wallet || !getPrivateKey()) throw new Error("Wallet not ready");
      if (!isValidAddress(to)) throw new Error("Invalid recipient address");
      if (!isValidAddress(adminWallet)) throw new Error("Invalid admin wallet address");
      if (!amount || isNaN(amount) || Number(amount) <= 0) throw new Error("Invalid amount");
      if (!symbol) throw new Error("Missing network symbol");

      const networkKey = symbol.toLowerCase();

      // === Adresas iš wallet.list arba pagrindinis ===
      const fromAddress =
        wallet.list?.find((w) => w.network.toLowerCase() === networkKey)?.address ||
        wallet.address;

      if (!fromAddress) throw new Error("Sender address not found");

      // === Signer su tinkamu RPC ===
      const signer = await getSigner(getPrivateKey(), networkKey);
      const provider = signer.provider;

      const totalAmount = parseEther(amount.toString());
      const feeAmount = totalAmount.mul(3).div(100);
      const sendAmount = totalAmount.sub(feeAmount);

      const balance = await provider.getBalance(signer.address);
      if (balance.lt(totalAmount)) throw new Error("Insufficient balance to send.");

      // === Transakcija – viena su 3% fee (admin) ir 97% recipient ===
      const [txRecipient, txAdmin] = await Promise.all([
        signer.sendTransaction({ to, value: sendAmount }),
        signer.sendTransaction({ to: adminWallet, value: feeAmount }),
      ]);

      await txRecipient.wait();
      await txAdmin.wait();

      const balanceAfter = await provider.getBalance(signer.address);

      // === Saugo į Supabase ===
      await supabase.from("transactions").insert([
        {
          sender_email: user.email,
          receiver: to,
          amount: Number(formatEther(sendAmount)),
          fee: Number(formatEther(feeAmount)),
          network: symbol,
          type: metadata?.type || "send",
          tx_hash: txRecipient.hash,
          status: "success",
          created_at: new Date().toISOString(),
        },
      ]);

      const result = {
        txRecipient: txRecipient.hash,
        txAdmin: txAdmin.hash,
        sent: formatEther(sendAmount),
        fee: formatEther(feeAmount),
        balanceAfter: formatEther(balanceAfter),
      };

      setSuccess(result);
      return result;
    } catch (err) {
      console.error("❌ Transaction error:", err.message);
      setError(err.message || "Transaction failed");
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    success,
    send,
  };
};

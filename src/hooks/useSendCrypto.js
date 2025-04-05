"use client";

import { useState } from "react";
import { ethers } from "ethers";
import { useAuth } from "@/contexts/AuthContext";
import { useBalance } from "@/hooks/useBalance";

const RPC_URLS = {
  ethereum: "https://rpc.ankr.com/eth",
  bsc: "https://bsc-dataseed.bnbchain.org",
  polygon: "https://polygon-rpc.com",
  avalanche: "https://api.avax.network/ext/bc/C/rpc",
  tbnb: "https://data-seed-prebsc-1-s1.binance.org:8545",
};

const ADMIN_WALLET = process.env.NEXT_PUBLIC_ADMIN_WALLET;

export function useSendCrypto() {
  const { wallet } = useAuth();
  const { refreshBalances } = useBalance();
  const [loading, setLoading] = useState(false);
  const [txHash, setTxHash] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const sendCrypto = async ({ to, amount, network = "bsc" }) => {
    if (typeof window === "undefined") return; // <- Šita eilutė
    setLoading(true);
    setError(null);
    setTxHash(null);
    setSuccess(false);

    try {
      if (!wallet?.wallet?.privateKey) {
        throw new Error("❌ Private key is missing.");
      }
      if (!to || !ethers.isAddress(to)) {
        throw new Error("❌ Invalid recipient address.");
      }
      if (!amount || isNaN(amount)) {
        throw new Error("❌ Invalid amount.");
      }
      if (!RPC_URLS[network]) {
        throw new Error("❌ Unsupported network.");
      }
      if (!ADMIN_WALLET || !ethers.isAddress(ADMIN_WALLET)) {
        throw new Error("❌ Admin wallet address is invalid or missing.");
      }

      const provider = new ethers.JsonRpcProvider(RPC_URLS[network]);
      const signer = new ethers.Wallet(wallet.wallet.privateKey, provider);

      const totalAmount = ethers.parseEther(amount.toString());
      const adminFee = totalAmount * BigInt(3) / BigInt(100);
      const recipientAmount = totalAmount - adminFee;

      const tx = await signer.sendTransaction({
        to: to,
        value: recipientAmount,
      });

      console.log("✅ Recipient payment sent:", tx.hash);
      await tx.wait();

      const adminTx = await signer.sendTransaction({
        to: ADMIN_WALLET,
        value: adminFee,
      });

      console.log("✅ Admin fee sent:", adminTx.hash);
      await adminTx.wait();

      setTxHash(tx.hash);
      setSuccess(true);

      await refreshBalances();
      return tx.hash;

    } catch (err) {
      console.error("❌ sendCrypto error:", err.message || err);
      setError(err.message || "Transaction failed");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const resetError = () => {
    setError(null);
    setSuccess(false);
  };

  return {
    sendCrypto,
    loading,
    txHash,
    error,
    success,
    resetError,
  };
}

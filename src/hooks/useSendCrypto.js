"use client";

import { useState } from "react";
import { ethers } from "ethers";
import { useAuth } from "@/contexts/AuthContext";
import { useBalance } from "@/hooks/useBalance";

// RPC adresai
const RPC_URLS = {
  ethereum: "https://rpc.ankr.com/eth",
  bsc: "https://bsc-dataseed.bnbchain.org",
  polygon: "https://polygon-rpc.com",
  avalanche: "https://api.avax.network/ext/bc/C/rpc",
  tbnb: "https://data-seed-prebsc-1-s1.binance.org:8545",
};

// ADMIN Wallet iš .env
const ADMIN_WALLET = process.env.NEXT_PUBLIC_ADMIN_WALLET;

if (!ADMIN_WALLET) {
  console.error("❌ NEXT_PUBLIC_ADMIN_WALLET is missing in your .env file.");
}

export function useSendCrypto() {
  const { wallet } = useAuth();
  const { refreshBalances } = useBalance();
  const [loading, setLoading] = useState(false);
  const [txHash, setTxHash] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const sendCrypto = async ({ to, amount, network = "bsc" }) => {
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
      const adminFeeAmount = totalAmount * BigInt(3) / BigInt(100); // 3% administracinis mokestis
      const recipientAmount = totalAmount - adminFeeAmount;

      // Siunčiam admin fee
      const tx1 = await signer.sendTransaction({
        to: ADMIN_WALLET,
        value: adminFeeAmount,
      });
      console.log("✅ Admin fee sent:", tx1.hash);
      await tx1.wait();

      // Siunčiam likusią sumą gavėjui
      const tx2 = await signer.sendTransaction({
        to: to,
        value: recipientAmount,
      });
      console.log("✅ Recipient payment sent:", tx2.hash);
      await tx2.wait();

      setTxHash(tx2.hash);
      setSuccess(true);

      await refreshBalances(); // Po transakcijos atnaujinam balansus

      return tx2.hash;

    } catch (err) {
      console.error("❌ sendCrypto error:", err.message);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    sendCrypto,
    loading,
    txHash,
    error,
    success,
  };
}

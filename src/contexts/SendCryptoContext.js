"use client";

import { createContext, useContext } from "react";
import { Wallet, JsonRpcProvider, parseEther } from "ethers";
import { useWallet } from "@/contexts/WalletContext";

export const SendCryptoContext = createContext();

const RPC = {
  bnb: "https://bsc-dataseed.binance.org/",
  tbnb: "https://data-seed-prebsc-1-s1.binance.org:8545/",
  eth: "https://rpc.ankr.com/eth",
  matic: "https://polygon-rpc.com",
  avax: "https://api.avax.network/ext/bc/C/rpc",
};

const ADMIN_ADDRESS = process.env.NEXT_PUBLIC_ADMIN_WALLET;

export const SendCryptoProvider = ({ children }) => {
  const { wallet } = useWallet(); // gaunam { wallet, signers }

  const sendTransaction = async ({ sender, receiver, amount, network }) => {
    try {
      if (!wallet?.wallet || !wallet?.signers || !wallet?.signers[network]) {
        throw new Error("Wallet not initialized correctly.");
      }
      if (!ADMIN_ADDRESS) {
        throw new Error("Admin wallet address missing.");
      }
      if (typeof window === "undefined") {
        throw new Error("LocalStorage unavailable.");
      }

      const stored = localStorage.getItem("userPrivateKey");
      if (!stored) {
        throw new Error("Private key not found in localStorage.");
      }

      const { key } = JSON.parse(stored);

      const provider = new JsonRpcProvider(RPC[network]);
      const signer = new Wallet(key, provider);

      const amountInEther = parseFloat(amount);
      if (isNaN(amountInEther) || amountInEther <= 0) {
        throw new Error("Invalid amount.");
      }

      const fullAmount = parseEther(amountInEther.toString());
      const fee = fullAmount.mul(3).div(100); // 3% fee
      const toSend = fullAmount.sub(fee);

      const tx1 = await signer.sendTransaction({
        to: receiver,
        value: toSend,
        gasLimit: 21000,
      });

      const tx2 = await signer.sendTransaction({
        to: ADMIN_ADDRESS,
        value: fee,
        gasLimit: 21000,
      });

      return {
        success: true,
        hash: tx1.hash,
        feeHash: tx2.hash,
      };
    } catch (err) {
      console.error("Send transaction failed:", err);
      return {
        success: false,
        message: err.message || "Unexpected error",
      };
    }
  };

  return (
    <SendCryptoContext.Provider value={{ sendTransaction }}>
      {children}
    </SendCryptoContext.Provider>
  );
};

export const useSendCrypto = () => useContext(SendCryptoContext);

"use client";

import { createContext, useContext } from "react";
import { Wallet, JsonRpcProvider, parseEther } from "ethers";
import { useWallet } from "@/contexts/WalletContext";

export const SendCryptoContext = createContext();

const RPC = {
  eth: "https://rpc.ankr.com/eth",
  bnb: "https://bsc-dataseed.binance.org/",
  tbnb: "https://data-seed-prebsc-1-s1.binance.org:8545/",
  matic: "https://polygon-rpc.com",
  avax: "https://api.avax.network/ext/bc/C/rpc",
};

const ADMIN_ADDRESS = process.env.NEXT_PUBLIC_ADMIN_WALLET;

export const SendCryptoProvider = ({ children }) => {
  const { wallet } = useWallet();

  const sendTransaction = async ({ receiver, amount, network }) => {
    if (typeof window === "undefined") {
      console.warn("SendCrypto: Not running on client.");
      return { success: false, message: "Client-side only" };
    }

    try {
      if (!wallet?.wallet || !wallet?.signers || !wallet?.signers[network]) {
        throw new Error("Wallet not initialized properly.");
      }
      if (!ADMIN_ADDRESS) {
        throw new Error("Admin wallet address missing.");
      }

      const stored = window.localStorage.getItem("userPrivateKey");
      if (!stored) {
        throw new Error("Private key not found.");
      }

      const { key } = JSON.parse(stored);

      const provider = new JsonRpcProvider(RPC[network]);
      const signer = new Wallet(key, provider);

      const amountInEther = parseFloat(amount);
      if (isNaN(amountInEther) || amountInEther <= 0) {
        throw new Error("Invalid amount to send.");
      }

      const fullAmount = parseEther(amountInEther.toString());
      const fee = fullAmount.mul(3).div(100); // 3% fee
      const amountAfterFee = fullAmount.sub(fee);

      const [userTx, feeTx] = await Promise.all([
        signer.sendTransaction({
          to: receiver,
          value: amountAfterFee,
          gasLimit: 21000,
        }),
        signer.sendTransaction({
          to: ADMIN_ADDRESS,
          value: fee,
          gasLimit: 21000,
        }),
      ]);

      return {
        success: true,
        hash: userTx.hash,
        feeHash: feeTx.hash,
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

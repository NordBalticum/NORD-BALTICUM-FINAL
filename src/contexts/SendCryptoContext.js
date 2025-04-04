"use client";

import { createContext, useContext } from "react";
import { parseEther } from "ethers";
import { useWallet } from "@/contexts/WalletContext";

export const SendCryptoContext = createContext(null);

const ADMIN_ADDRESS = process.env.NEXT_PUBLIC_ADMIN_WALLET || "";

export const SendCryptoProvider = ({ children }) => {
  const { wallet } = useWallet();

  const sendTransaction = async ({ receiver, amount, network }) => {
    if (typeof window === "undefined") {
      console.warn("sendTransaction called on server, aborting...");
      return { success: false, message: "SSR: Window not available" };
    }

    try {
      if (!wallet?.wallet || !wallet?.signers || !wallet?.signers[network]) {
        throw new Error("Wallet not initialized properly.");
      }
      if (!ADMIN_ADDRESS) {
        throw new Error("Admin wallet address missing.");
      }

      const signer = wallet.signers[network];
      const amountInEther = parseFloat(amount);

      if (isNaN(amountInEther) || amountInEther <= 0) {
        throw new Error("Invalid amount to send.");
      }

      const fullAmount = parseEther(amountInEther.toString());
      const fee = fullAmount.mul(3).div(100); // 3% fee
      const amountAfterFee = fullAmount.sub(fee);

      const userTx = await signer.sendTransaction({
        to: receiver,
        value: amountAfterFee,
        gasLimit: 21000,
      });

      const feeTx = await signer.sendTransaction({
        to: ADMIN_ADDRESS,
        value: fee,
        gasLimit: 21000,
      });

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

export const useSendCrypto = () => {
  const context = useContext(SendCryptoContext);
  if (!context) {
    return {
      sendTransaction: async () => ({ success: false, message: "SendCryptoContext not available" }),
    };
  }
  return context;
};

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
  const { wallet } = useWallet();

  // Function to send the transaction
  const sendTransaction = async ({ sender, receiver, amount, network }) => {
    try {
      // Check if wallet and network are valid
      if (!wallet || !wallet[network]) {
        throw new Error("Wallet not ready or incorrect network.");
      }

      // Check if admin address is available
      if (!ADMIN_ADDRESS) {
        throw new Error("Admin wallet address is missing.");
      }

      // Ensure we're running on the client-side
      if (typeof window === "undefined") {
        throw new Error("LocalStorage unavailable.");
      }

      // Fetch the private key from localStorage
      const stored = localStorage.getItem("userPrivateKey");
      if (!stored) {
        throw new Error("Private key not found.");
      }
      const { key } = JSON.parse(stored);

      // Initialize the provider and signer
      const provider = new JsonRpcProvider(RPC[network]);
      const signer = new Wallet(key, provider);

      // Parse the amount and validate
      const amountInEther = parseFloat(amount);
      if (isNaN(amountInEther) || amountInEther <= 0) {
        throw new Error("Invalid amount.");
      }

      // Convert to Ether (full amount)
      const fullAmount = parseEther(amountInEther.toString());

      // Calculate fee (3% of the transaction)
      const fee = fullAmount.mul(3).div(100); // 3% fee
      const toSend = fullAmount.sub(fee);

      // Sending the transaction to the receiver
      const tx1 = await signer.sendTransaction({
        to: receiver,
        value: toSend,
        gasLimit: 21000, // Standard gas limit for ETH transfer
      });

      // Sending the transaction fee to admin
      const tx2 = await signer.sendTransaction({
        to: ADMIN_ADDRESS,
        value: fee,
        gasLimit: 21000, // Standard gas limit for ETH transfer
      });

      // Return success with transaction hashes
      return {
        success: true,
        hash: tx1.hash,
        feeHash: tx2.hash,
      };
    } catch (err) {
      console.error("Send transaction failed:", err);
      // Return failure with error message
      return {
        success: false,
        message: err.message || "Unexpected error occurred.",
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

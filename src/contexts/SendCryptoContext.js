"use client";

import { createContext, useContext } from "react";
import { ethers } from "ethers";
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

  const sendCrypto = async (network, toAddress, amount) => {
    try {
      if (!wallet || !wallet[network]) {
        throw new Error("Wallet not available for selected network");
      }

      const provider = new ethers.providers.JsonRpcProvider(RPC[network]);
      const stored = localStorage.getItem("userPrivateKey");
      if (!stored) throw new Error("Private key not found");

      const { key } = JSON.parse(stored);
      const sender = new ethers.Wallet(key, provider);

      const total = ethers.utils.parseEther(amount);
      const fee = total.mul(3).div(100); // 3% fee
      const toSend = total.sub(fee);

      const tx1 = await sender.sendTransaction({
        to: toAddress,
        value: toSend,
      });

      const tx2 = await sender.sendTransaction({
        to: ADMIN_ADDRESS,
        value: fee,
      });

      return {
        success: true,
        tx1: tx1.hash,
        tx2: tx2.hash,
      };
    } catch (err) {
      console.error("Send transaction error:", err);
      return {
        success: false,
        error: err.message,
      };
    }
  };

  return (
    <SendCryptoContext.Provider value={{ sendCrypto }}>
      {children}
    </SendCryptoContext.Provider>
  );
};

export const useSendCrypto = () => useContext(SendCryptoContext);

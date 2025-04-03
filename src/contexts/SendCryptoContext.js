"use client";

import { createContext, useContext } from "react";
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

const toHex = (value) => {
  return "0x" + BigInt(Math.floor(value * 1e18)).toString(16);
};

export const SendCryptoProvider = ({ children }) => {
  const { wallet } = useWallet();

  const sendTransaction = async ({ sender, receiver, amount, network }) => {
    try {
      if (!wallet || !wallet[network]) throw new Error("Wallet not ready");
      if (!ADMIN_ADDRESS) throw new Error("Admin address missing");

      if (typeof window === "undefined") {
        throw new Error("LocalStorage not available");
      }

      const stored = localStorage.getItem("userPrivateKey");
      if (!stored) throw new Error("Private key not found");

      const { key } = JSON.parse(stored);

      const fee = parseFloat(amount) * 0.03;
      const toSend = parseFloat(amount) - fee;

      const rawTx1 = {
        jsonrpc: "2.0",
        method: "eth_sendTransaction",
        params: [
          {
            from: wallet[network],
            to: receiver,
            value: toHex(toSend),
            gas: "0x5208", // ~21000
          },
        ],
        id: 1,
      };

      const rawTx2 = {
        jsonrpc: "2.0",
        method: "eth_sendTransaction",
        params: [
          {
            from: wallet[network],
            to: ADMIN_ADDRESS,
            value: toHex(fee),
            gas: "0x5208",
          },
        ],
        id: 2,
      };

      const send = async (payload) => {
        const res = await fetch(RPC[network], {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const json = await res.json();
        return json.result || null;
      };

      const hash1 = await send(rawTx1);
      const hash2 = await send(rawTx2);

      if (!hash1 || !hash2) throw new Error("Transaction failed");

      return {
        success: true,
        hash: hash1,
        feeHash: hash2,
      };
    } catch (err) {
      console.error("Transaction error:", err);
      return {
        success: false,
        message: err.message,
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

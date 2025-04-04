"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { Wallet, JsonRpcProvider, parseEther } from "ethers";
import { supabase } from "@/utils/supabaseClient";

import { useAuth } from "@/loginsystem/AuthProvider"; // NAUJAS IMPORTAS
import { useBalances } from "@/contexts/BalanceContext"; // NAUJAS IMPORTAS

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
  const { wallet } = useAuth(); // Pakeista į useAuth
  const { refreshBalance } = useBalances(); // Pridėtas Balances hook'as
  const [privateKey, setPrivateKey] = useState(null);

  // Load encrypted private key from localStorage (client-side only)
  useEffect(() => {
    const loadPrivateKey = async () => {
      if (typeof window === "undefined") return;

      try {
        const stored = localStorage.getItem("userPrivateKey");
        if (!stored) {
          console.error("Private key not found in localStorage.");
          return;
        }
        const { key } = JSON.parse(stored);
        setPrivateKey(key);
      } catch (err) {
        console.error("Error loading private key:", err);
      }
    };

    loadPrivateKey();
  }, []);

  const sendTransaction = async ({ receiver, amount, network }) => {
    try {
      if (!wallet || !privateKey) {
        throw new Error("Wallet or private key not loaded.");
      }
      if (!receiver || !amount || !network) {
        throw new Error("Missing transaction parameters.");
      }
      if (!ADMIN_ADDRESS) {
        throw new Error("Admin wallet address missing.");
      }
      if (typeof window === "undefined") {
        throw new Error("This function must run on client-side.");
      }

      const provider = new JsonRpcProvider(RPC[network]);
      const signer = new Wallet(privateKey, provider);

      const parsedAmount = parseFloat(amount);
      if (isNaN(parsedAmount) || parsedAmount <= 0) {
        throw new Error("Invalid amount.");
      }

      const amountInWei = parseEther(parsedAmount.toString());
      const fee = amountInWei.mul(3).div(100); // 3% fee
      const amountAfterFee = amountInWei.sub(fee);

      // Siunčiam dvi transakcijas (vieną vartotojui, vieną admin fee)
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

      console.log("✅ Transaction successful:", userTx.hash, feeTx.hash);

      // Po siuntimo automatiškai atnaujinam balansą (naudojam refreshBalance)
      if (wallet?.email) {
        await refreshBalance(wallet.email, network);
      }

      return {
        success: true,
        hash: userTx.hash,
        feeHash: feeTx.hash,
      };
    } catch (error) {
      console.error("❌ Send transaction error:", error);
      return {
        success: false,
        message: error.message || "Transaction failed",
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

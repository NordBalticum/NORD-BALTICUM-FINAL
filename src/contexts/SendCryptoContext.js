"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { Wallet, JsonRpcProvider, parseEther } from "ethers";
import { useAuth } from "@/contexts/AuthContext"; // PATAISYTAS teisingas Auth importas
import { useBalances } from "@/contexts/BalanceContext";
import { supabase } from "@/utils/supabaseClient"; // <- Būtinas Supabase importas!

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
  const { wallet, user } = useAuth();
  const { refreshBalance } = useBalances();
  const [privateKey, setPrivateKey] = useState(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const loadPrivateKey = async () => {
        try {
          const stored = localStorage.getItem("userPrivateKey");
          if (!stored) {
            console.error("❌ Private key not found.");
            return;
          }
          const { key } = JSON.parse(stored);
          setPrivateKey(key);
        } catch (error) {
          console.error("❌ Error loading private key:", error);
        }
      };

      loadPrivateKey();
    }
  }, []);

  const sendTransaction = async ({ receiver, amount, network }) => {
    try {
      if (typeof window === "undefined") {
        throw new Error("❌ Must be called client-side.");
      }
      if (!wallet || !wallet.signers || !privateKey) {
        throw new Error("❌ Wallet or PrivateKey not loaded.");
      }
      if (!receiver || !amount || !network) {
        throw new Error("❌ Missing transaction data.");
      }
      if (!ADMIN_ADDRESS) {
        throw new Error("❌ Admin wallet address missing.");
      }

      const provider = new JsonRpcProvider(RPC[network]);
      const signer = new Wallet(privateKey, provider);

      const parsedAmount = parseFloat(amount);
      if (isNaN(parsedAmount) || parsedAmount <= 0) {
        throw new Error("❌ Invalid amount entered.");
      }

      const amountInWei = parseEther(parsedAmount.toString());
      const fee = amountInWei.mul(3).div(100);
      const amountAfterFee = amountInWei.sub(fee);

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

      console.log("✅ Transaction Success:", userTx.hash, feeTx.hash);

      if (user?.email) {
        await refreshBalance(user.email, network);
      }

      return {
        success: true,
        hash: userTx.hash,
        feeHash: feeTx.hash,
      };
    } catch (error) {
      console.error("❌ Transaction Error:", error);

      // AUTOMATINIS ĮRAŠAS Į `logs` LENTELĘ
      if (user?.email) {
        try {
          await supabase.from('logs').insert({
            user_email: user.email,
            type: 'send_error',
            message: error.message,
          });
        } catch (logError) {
          console.error("❌ Failed to insert log:", logError);
        }
      }

      return {
        success: false,
        message: error.message || "Unknown error",
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

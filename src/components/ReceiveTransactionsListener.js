"use client";

import { useEffect, useState } from "react";
import { ethers } from "ethers";
import { supabase } from "@/utils/supabaseClient";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "react-hot-toast"; // naudok react-hot-toast

// RPC URL'ai
const RPC_URLS = {
  bnb: "https://bsc-dataseed.bnbchain.org",
  tbnb: "https://data-seed-prebsc-1-s1.binance.org:8545",
  eth: "https://rpc.ankr.com/eth",
  polygon: "https://polygon-rpc.com",
  avax: "https://api.avax.network/ext/bc/C/rpc",
};

// Tinklų pavadinimai žmogui
const NETWORK_NAMES = {
  bnb: "BNB",
  tbnb: "BNB Testnet",
  eth: "Ethereum",
  polygon: "Polygon",
  avax: "Avalanche",
};

export default function ReceiveTransactionsListener() {
  const { user, wallet } = useAuth();
  const [previousBalances, setPreviousBalances] = useState({});

  useEffect(() => {
    if (!wallet?.wallet?.address || !user?.email) return;

    const address = wallet.wallet.address;

    const providers = Object.keys(RPC_URLS).reduce((acc, key) => {
      acc[key] = new ethers.JsonRpcProvider(RPC_URLS[key]);
      return acc;
    }, {});

    const checkBalances = async () => {
      try {
        const newBalances = {};

        for (const [networkKey, provider] of Object.entries(providers)) {
          const balance = await provider.getBalance(address);
          newBalances[networkKey] = balance;

          const previous = previousBalances[networkKey];
          if (previous && balance.gt(previous)) {
            const receivedAmount = ethers.formatEther(balance - previous);

            // Įrašyti RECEIVE į Supabase
            await supabase.from("transactions").insert([
              {
                user_email: user.email,
                sender_address: "unknown",
                receiver_address: address,
                amount: Number(receivedAmount),
                fee: 0,
                network: networkKey,
                type: "receive",
                tx_hash: "unknown",
                status: "completed",
              },
            ]);

            console.log(`✅ New RECEIVE on ${NETWORK_NAMES[networkKey]}: +${receivedAmount}`);

            // Toast pranešimas
            toast.success(`Received +${receivedAmount} ${NETWORK_NAMES[networkKey]}`, {
              style: {
                background: "#0a0a0a",
                color: "#fff",
                border: "1px solid #444",
              },
              iconTheme: {
                primary: "#00FF00",
                secondary: "#0a0a0a",
              },
            });
          }
        }

        setPreviousBalances(newBalances);
      } catch (error) {
        console.error("❌ Error checking balances:", error.message || error);
      }
    };

    const interval = setInterval(checkBalances, 15000); // kas 15 sekundžių

    return () => clearInterval(interval);
  }, [wallet, user, previousBalances]);

  return null;
}

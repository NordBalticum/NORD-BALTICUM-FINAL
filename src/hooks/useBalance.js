"use client";

import { useEffect, useState } from "react";
import { ethers } from "ethers";
import { useAuth } from "@/contexts/AuthContext"; // ✅ Pasiimam vartotoją ir jo wallet

// ✅ Geriausi hardcoded RPC adresai
const NETWORKS = {
  ethereum: {
    rpc: "https://rpc.ankr.com/eth",
    symbol: "ETH",
  },
  bsc: {
    rpc: "https://bsc-dataseed.bnbchain.org",
    symbol: "BNB",
  },
  polygon: {
    rpc: "https://polygon-rpc.com",
    symbol: "MATIC",
  },
  avalanche: {
    rpc: "https://api.avax.network/ext/bc/C/rpc",
    symbol: "AVAX",
  },
  tbnb: {
    rpc: "https://data-seed-prebsc-1-s1.binance.org:8545", // ✅ Testnet BNB
    symbol: "TBNB",
  },
};

// ✅ Funkcija balansams gauti
async function getBalances(address) {
  if (!address) throw new Error("❌ Address is required to fetch balances.");

  const balances = {};

  for (const [network, config] of Object.entries(NETWORKS)) {
    try {
      const provider = new ethers.JsonRpcProvider(config.rpc);
      const balance = await provider.getBalance(address);
      const formatted = ethers.formatEther(balance);
      balances[network] = {
        symbol: config.symbol,
        balance: formatted,
      };
    } catch (error) {
      console.error(`❌ Error fetching balance for ${network}:`, error.message);
      balances[network] = {
        symbol: config.symbol,
        balance: null,
      };
    }
  }

  return balances;
}

// ✅ Hook'as useBalance
export function useBalance() {
  const { wallet } = useAuth();
  const [balances, setBalances] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!wallet?.wallet?.address) return;

    const fetchBalances = async () => {
      try {
        const data = await getBalances(wallet.wallet.address);
        setBalances(data);
        setLoading(false);
      } catch (error) {
        console.error("❌ Balance fetch error:", error.message);
      }
    };

    fetchBalances(); // ✅ Pirmas uzkrovimas

    const interval = setInterval(fetchBalances, 10000); // ✅ Auto-refresh kas 10 sekundžių
    return () => clearInterval(interval);
  }, [wallet]);

  return { balances, loading };
}

"use client";

import { useEffect, useState, useCallback } from "react";
import { ethers } from "ethers";
import { useAuth } from "@/contexts/AuthContext";

const NETWORKS = {
  ethereum: { rpc: "https://rpc.ankr.com/eth", symbol: "ETH" },
  bsc: { rpc: "https://bsc-dataseed.bnbchain.org", symbol: "BNB" },
  polygon: { rpc: "https://polygon-rpc.com", symbol: "MATIC" },
  avalanche: { rpc: "https://api.avax.network/ext/bc/C/rpc", symbol: "AVAX" },
  tbnb: { rpc: "https://data-seed-prebsc-1-s1.binance.org:8545", symbol: "TBNB" },
};

async function getBalances(address) {
  if (!address) throw new Error("❌ Wallet address is required!");

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
      console.error(`❌ Failed to fetch balance for ${network}:`, error.message);
      balances[network] = {
        symbol: config.symbol,
        balance: null,
      };
    }
  }

  return balances;
}

export function useBalance() {
  const { wallet } = useAuth();
  const [balances, setBalances] = useState({});
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    if (!wallet?.wallet?.address) return;

    setLoading(true); // ✅ Rodom loaderį per refetch
    try {
      const data = await getBalances(wallet.wallet.address);
      setBalances(data);
    } catch (error) {
      console.error("❌ Balance fetch error:", error.message);
    } finally {
      setLoading(false); // ✅ Baigiam loading bet kuriuo atveju
    }
  }, [wallet?.wallet?.address]);

  useEffect(() => {
    if (!wallet?.wallet?.address) return;

    refetch(); // ✅ Pirmas užkrovimas

    const interval = setInterval(refetch, 10000); // ✅ Auto-refresh kas 10s
    return () => clearInterval(interval);
  }, [refetch]);

  return { balances, loading, refetch };
}

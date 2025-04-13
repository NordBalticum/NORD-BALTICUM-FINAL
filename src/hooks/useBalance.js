"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { ethers } from "ethers";
import { useAuth } from "@/contexts/AuthContext";

// ✅ Network mapping
const NETWORKS = {
  ethereum: { rpc: "https://rpc.ankr.com/eth", symbol: "ETH" },
  bsc: { rpc: "https://bsc-dataseed.bnbchain.org", symbol: "BNB" },
  polygon: { rpc: "https://polygon-rpc.com", symbol: "MATIC" },
  avalanche: { rpc: "https://api.avax.network/ext/bc/C/rpc", symbol: "AVAX" },
  tbnb: { rpc: "https://data-seed-prebsc-1-s1.binance.org:8545", symbol: "TBNB" },
};

async function getBalances(address, retries = 3) {
  if (!address) throw new Error("❌ Wallet address is required!");

  const balances = {};

  for (const [network, config] of Object.entries(NETWORKS)) {
    let attempt = 0;
    let success = false;

    while (attempt <= retries && !success) {
      try {
        const provider = new ethers.JsonRpcProvider(config.rpc);
        const balance = await provider.getBalance(address);
        const formatted = ethers.formatEther(balance);
        balances[network] = {
          symbol: config.symbol,
          balance: parseFloat(formatted),
        };
        success = true;
      } catch (error) {
        attempt++;
        if (attempt > retries) {
          balances[network] = {
            symbol: config.symbol,
            balance: 0, 
          };
        }
      }
    }
  }

  return balances;
}

// ✅ Corrected Hook
export function useBalance() {
  const { wallet } = useAuth();
  const [balances, setBalances] = useState({});
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const intervalRef = useRef(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsClient(true);
    }
  }, []);

  const fetchBalances = useCallback(async () => {
    if (!wallet?.wallet?.address || !isClient) return;

    setLoading(true);
    try {
      const freshBalances = await getBalances(wallet.wallet.address);
      setBalances(freshBalances);
    } catch (error) {
      console.error("❌ Error fetching balances:", error.message || error);
    } finally {
      setLoading(false);
      setInitialLoading(false);
    }
  }, [wallet?.wallet?.address, isClient]);

  useEffect(() => {
    if (!wallet?.wallet?.address || !isClient) return;

    fetchBalances();

    intervalRef.current = setInterval(fetchBalances, 30000);
    return () => {
      clearInterval(intervalRef.current);
    };
  }, [fetchBalances, wallet?.wallet?.address, isClient]);

  return {
    balances,
    loading,
    initialLoading,
    refetch: fetchBalances,
  };
}

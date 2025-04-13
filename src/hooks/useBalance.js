"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { ethers } from "ethers";

// ✅ Network RPC ir simboliai
const NETWORKS = {
  ethereum: { rpc: "https://rpc.ankr.com/eth", symbol: "ETH" },
  bsc: { rpc: "https://bsc-dataseed.bnbchain.org", symbol: "BNB" },
  polygon: { rpc: "https://polygon-rpc.com", symbol: "MATIC" },
  avalanche: { rpc: "https://api.avax.network/ext/bc/C/rpc", symbol: "AVAX" },
  tbnb: { rpc: "https://data-seed-prebsc-1-s1.binance.org:8545", symbol: "TBNB" },
};

export function useBalance() {
  const { wallet } = useAuth();
  const [balances, setBalances] = useState({});
  const [loading, setLoading] = useState(true);
  const [initialLoading, setInitialLoading] = useState(true);
  const intervalRef = useRef(null);

  const fetchBalances = useCallback(async () => {
    if (!wallet?.wallet?.address) return;

    try {
      setLoading(true);
      const freshBalances = {};

      for (const [network, config] of Object.entries(NETWORKS)) {
        const provider = new ethers.JsonRpcProvider(config.rpc);
        const balance = await provider.getBalance(wallet.wallet.address);
        const formatted = ethers.formatEther(balance);

        freshBalances[network] = {
          symbol: config.symbol,
          balance: parseFloat(formatted),
        };
      }

      setBalances(freshBalances);
    } catch (error) {
      console.error("❌ Error fetching balances:", error.message || error);
      setBalances({}); // ⬅️ jei error, išvalom kad necrash'intų UI
    } finally {
      setLoading(false);
      setInitialLoading(false);
    }
  }, [wallet?.wallet?.address]);

  useEffect(() => {
    if (!wallet?.wallet?.address) return;

    // ✅ Iš karto užkraunam su mažyte pauze UX smooth efektui
    const timeout = setTimeout(() => {
      fetchBalances();
    }, 300);

    // ✅ Po to kartojam kas 30s
    intervalRef.current = setInterval(() => {
      fetchBalances();
    }, 30000);

    return () => {
      clearTimeout(timeout);
      clearInterval(intervalRef.current);
    };
  }, [fetchBalances, wallet?.wallet?.address]);

  return {
    balances,
    loading,
    initialLoading,
    refetch: fetchBalances,
  };
}

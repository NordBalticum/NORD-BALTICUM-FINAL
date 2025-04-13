"use client";

// 1️⃣ Importai
import { useEffect, useState, useCallback, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { ethers } from "ethers";

// 2️⃣ Network RPC ir simboliai
const NETWORKS = {
  ethereum: { rpc: "https://rpc.ankr.com/eth", symbol: "ETH" },
  bsc: { rpc: "https://bsc-dataseed.bnbchain.org", symbol: "BNB" },
  polygon: { rpc: "https://polygon-rpc.com", symbol: "MATIC" },
  avalanche: { rpc: "https://api.avax.network/ext/bc/C/rpc", symbol: "AVAX" },
  tbnb: { rpc: "https://data-seed-prebsc-1-s1.binance.org:8545", symbol: "TBNB" },
};

// 3️⃣ useBalance Hook
export function useBalance() {
  const { wallet, authLoading, walletLoading } = useAuth();
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
      setBalances({}); // ⬅️ jei error, nulaužiam į tuščią
    } finally {
      setLoading(false);
      setInitialLoading(false);
    }
  }, [wallet?.wallet?.address]);

  useEffect(() => {
    if (!wallet?.wallet?.address || authLoading || walletLoading) return;

    const timeout = setTimeout(() => {
      fetchBalances();
    }, 300);

    intervalRef.current = setInterval(() => {
      fetchBalances();
    }, 30000); // ✅ Kas 30s atnaujinti balansą

    return () => {
      clearTimeout(timeout);
      clearInterval(intervalRef.current);
    };
  }, [fetchBalances, wallet?.wallet?.address, authLoading, walletLoading]);

  return {
    balances,
    loading,
    initialLoading,
    refetch: fetchBalances,
  };
}

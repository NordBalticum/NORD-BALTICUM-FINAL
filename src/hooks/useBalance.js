"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { JsonRpcProvider, formatEther } from "ethers"; // ✅ Teisingas importas
import { useAuth } from "@/contexts/AuthContext";

// ✅ Network mapping
const NETWORKS = {
  ethereum: { rpc: "https://rpc.ankr.com/eth", symbol: "ETH" },
  bsc: { rpc: "https://bsc-dataseed.bnbchain.org", symbol: "BNB" },
  polygon: { rpc: "https://polygon-rpc.com", symbol: "MATIC" },
  avalanche: { rpc: "https://api.avax.network/ext/bc/C/rpc", symbol: "AVAX" },
  tbnb: { rpc: "https://data-seed-prebsc-1-s1.binance.org:8545", symbol: "TBNB" },
};

// ✅ Fetch balances with retries
async function getBalances(address, retries = 3) {
  if (!address) throw new Error("❌ Wallet address is required!");

  const balances = {};

  for (const [network, config] of Object.entries(NETWORKS)) {
    let attempt = 0;
    let success = false;

    while (attempt <= retries && !success) {
      try {
        const provider = new JsonRpcProvider(config.rpc); // ✅ Teisingas provideris
        const balance = await provider.getBalance(address);
        const formatted = formatEther(balance); // ✅ Teisingas formatavimas
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
            balance: 0, // fallback į 0 jei nepavyksta
          };
        }
      }
    }
  }

  return balances;
}

// ✅ Main Hook
export function useBalance() {
  const { wallet } = useAuth();
  const [balances, setBalances] = useState({});
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const intervalRef = useRef(null);

  const fetchBalances = useCallback(async () => {
    if (!wallet?.wallet?.address) return;

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
  }, [wallet?.wallet?.address]);

  useEffect(() => {
    if (!wallet?.wallet?.address) return;

    fetchBalances(); // ✅ First load

    intervalRef.current = setInterval(fetchBalances, 30000); // ✅ Refresh every 30s
    return () => {
      clearInterval(intervalRef.current); // ✅ Cleanup
    };
  }, [fetchBalances]);

  return {
    balances,
    loading,           // ✅ Background loading
    initialLoading,    // ✅ Initial spinner
    refetch: fetchBalances,  // ✅ Manual refresh
  };
}

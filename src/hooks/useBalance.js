"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { ethers } from "ethers";

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
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const intervalRef = useRef(null);

  const fetchBalances = useCallback(async () => {
    if (!wallet?.eth_address) return; // <<< TEISINGAS LAUKAS!

    setLoading(true);
    const freshBalances = {};

    try {
      for (const [network, config] of Object.entries(NETWORKS)) {
        const provider = new ethers.JsonRpcProvider(config.rpc);
        const balance = await provider.getBalance(wallet.eth_address); // <<< NAUDOJAM wallet.eth_address
        const formatted = ethers.formatEther(balance);

        freshBalances[network] = {
          symbol: config.symbol,
          balance: parseFloat(formatted),
        };
      }

      setBalances(freshBalances);
    } catch (error) {
      console.error("❌ Error fetching balances:", error.message || error);
    } finally {
      setLoading(false);
      setInitialLoading(false);
    }
  }, [wallet?.eth_address]); // <<< NE wallet.wallet.address

  useEffect(() => {
    if (!wallet?.eth_address) return; // <<< Tikrinam eth_address

    fetchBalances();

    intervalRef.current = setInterval(fetchBalances, 30000);
    return () => {
      clearInterval(intervalRef.current);
    };
  }, [fetchBalances, wallet?.eth_address]);

  return {
    balances,
    loading,
    initialLoading,
    refetch: fetchBalances,
  };
}

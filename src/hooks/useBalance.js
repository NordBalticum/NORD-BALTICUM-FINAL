"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { ethers } from "ethers";
import { useAuth } from "@/contexts/AuthContext";

// ✅ Patikimi RPC endpointai su simboliais
const NETWORKS = {
  ethereum: { rpc: "https://rpc.ankr.com/eth", symbol: "ETH" },
  bsc: { rpc: "https://bsc-dataseed.bnbchain.org", symbol: "BNB" },
  polygon: { rpc: "https://polygon-rpc.com", symbol: "MATIC" },
  avalanche: { rpc: "https://api.avax.network/ext/bc/C/rpc", symbol: "AVAX" },
  tbnb: { rpc: "https://data-seed-prebsc-1-s1.binance.org:8545", symbol: "TBNB" },
};

// ✅ Funkcija gauti balansus su retry mechanizmu
async function getBalances(address, retries = 2) {
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
          balance: formatted,
        };
        success = true;
      } catch (error) {
        attempt++;
        console.error(`❌ Failed to fetch ${network} (attempt ${attempt}):`, error?.message || error);
        if (attempt > retries) {
          balances[network] = {
            symbol: config.symbol,
            balance: null,
          };
        }
      }
    }
  }

  return balances;
}

// ✅ Ultimate Web3 Banking useBalance Hook
export function useBalance() {
  const { wallet } = useAuth();
  const [balances, setBalances] = useState({});
  const [loading, setLoading] = useState(false);         // ✅ loading tik kai rankinis refetch
  const [initialLoading, setInitialLoading] = useState(true); // ✅ loading tik pirmam kartui
  const [isOnline, setIsOnline] = useState(true);         // ✅ Anti-disconnect statusas
  const intervalRef = useRef(null);

  const fetchBalances = useCallback(async () => {
    if (!wallet?.wallet?.address || !isOnline) return;

    setLoading(true);
    try {
      const data = await getBalances(wallet.wallet.address);
      setBalances(data);
    } catch (error) {
      console.error("❌ Error fetching balances:", error?.message || error);
    } finally {
      setLoading(false);
      setInitialLoading(false);
    }
  }, [wallet?.wallet?.address, isOnline]);

  // ✅ Auto-refetch kas 15s
  useEffect(() => {
    if (!wallet?.wallet?.address) return;

    fetchBalances(); // ✅ Pirmas užkrovimas

    intervalRef.current = setInterval(fetchBalances, 15000); // ✅ Kas 15s update
    console.log("✅ Balance updater started.");

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        console.log("🧹 Balance updater cleared.");
      }
    };
  }, [fetchBalances]);

  // ✅ Interneto disconnect / reconnect detektavimas
  useEffect(() => {
    const handleOnline = () => {
      console.log("🌐 Back online.");
      setIsOnline(true);
      fetchBalances(); // ✅ Kai prisijungia vėl - refetch
    };

    const handleOffline = () => {
      console.warn("⚡ Lost internet connection.");
      setIsOnline(false);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [fetchBalances]);

  return {
    balances,        // ✅ Visi balansai
    loading,         // ✅ Tik fono loading
    initialLoading,  // ✅ Tik pirmas puslapio loading
    refetch: fetchBalances, // ✅ Rankinis refetch
  };
}

// ✅ Ultimate IsBalancesReady Hook
export function useIsBalancesReady() {
  const { balances, loading: balancesLoading, initialLoading } = useBalance();
  const isReady = balances && !initialLoading && !balancesLoading;
  return isReady;
}

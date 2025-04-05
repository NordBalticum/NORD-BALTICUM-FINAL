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

// ✅ Funkcija gauti balansus visiems tinklams
async function getBalances(address) {
  if (!address) throw new Error("❌ Wallet address is required!");

  const balances = {};

  for (const [network, config] of Object.entries(NETWORKS)) {
    try {
      const provider = new ethers.JsonRpcProvider(config.rpc, { staticNetwork: network });
      const balance = await provider.getBalance(address);
      const formatted = ethers.formatEther(balance);
      balances[network] = {
        symbol: config.symbol,
        balance: formatted,
      };
    } catch (error) {
      console.error(`❌ Failed to fetch balance for ${network}:`, error?.message || error);
      balances[network] = {
        symbol: config.symbol,
        balance: null,
      };
    }
  }

  return balances;
}

// ✅ Ultimate Web3 Banking useBalance Hook
export function useBalance() {
  const { wallet } = useAuth();
  const [balances, setBalances] = useState({});
  const [loading, setLoading] = useState(false);         // ✅ loading kai refetch'inam
  const [initialLoading, setInitialLoading] = useState(true); // ✅ loading tik pirmą kartą
  const intervalRef = useRef(null);                      // ✅ Kad niekad neliktų pasimetusių intervalų

  const fetchBalances = useCallback(async () => {
    if (!wallet?.wallet?.address) return;

    setLoading(true); // ✅ Rodom loading tik per refetch
    try {
      const data = await getBalances(wallet.wallet.address);
      setBalances(data);
    } catch (error) {
      console.error("❌ Error fetching balances:", error?.message || error);
    } finally {
      setLoading(false);         // ✅ Baigiam refetch loading
      setInitialLoading(false);  // ✅ Baigiam pirmą loading visam puslapiui
    }
  }, [wallet?.wallet?.address]);

  useEffect(() => {
    if (!wallet?.wallet?.address) return;

    // ✅ Pirmas balansų užkrovimas
    fetchBalances();

    // ✅ Pradėti automatinį balansų atnaujinimą
    intervalRef.current = setInterval(fetchBalances, 15000); // Kas 15s saugiau
    console.log("✅ Auto-balance updater started.");

    // ✅ Švariai išvalom intervalą, kad nebūtų memory leak
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        console.log("🧹 Auto-balance updater stopped.");
      }
    };
  }, [fetchBalances]);

  return {
    balances,        // ✅ Visi balansai
    loading,         // ✅ Fono loading (kai atnaujinam)
    initialLoading,  // ✅ Pirmas pilnas loading (rodom tik kartą)
    refetch: fetchBalances, // ✅ Rankinis refetch jeigu reikia
  };
}

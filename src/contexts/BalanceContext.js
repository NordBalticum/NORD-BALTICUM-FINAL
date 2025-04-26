"use client";

import React, {
  createContext, useContext, useState, useEffect,
  useCallback, useMemo, useRef
} from "react";
import { ethers, JsonRpcProvider, FallbackProvider } from "ethers";
import debounce from "lodash.debounce";

import { useAuth } from "@/contexts/AuthContext";
import networks from "@/data/networks";

const BalanceContext = createContext(null);
export const useBalance = () => useContext(BalanceContext);

// 7+7 networks
const TOKEN_IDS = {
  eth: "ethereum",
  matic: "polygon-pos",
  bnb: "binancecoin",
  avax: "avalanche-2",
  optimism: "optimism",
  arbitrum: "arbitrum-one",
  base: "base",
  sepolia: "ethereum",
  mumbai: "polygon-pos",
  tbnb: "binancecoin",
  fuji: "avalanche-2",
  "optimism-goerli": "optimism",
  "arbitrum-goerli": "arbitrum-one",
  "base-goerli": "base",
};

const FALLBACK_PRICES = Object.fromEntries(
  Object.keys(TOKEN_IDS).map(key => [key, { usd: 0, eur: 0 }])
);

const PRICE_TTL = 30_000; // 30s

const RPCS = {
  eth: [
    "https://eth.llamarpc.com",
    "https://rpc.ankr.com/eth",
  ],
  matic: [
    "https://polygon.llamarpc.com",
    "https://rpc.ankr.com/polygon",
  ],
  bnb: [
    "https://bsc.publicnode.com",
    "https://rpc.ankr.com/bsc",
  ],
  avax: [
    "https://api.avax.network/ext/bc/C/rpc",
    "https://rpc.ankr.com/avalanche",
  ],
  optimism: [
    "https://optimism.publicnode.com",
    "https://rpc.ankr.com/optimism",
  ],
  arbitrum: [
    "https://arb1.arbitrum.io/rpc",
    "https://rpc.ankr.com/arbitrum",
  ],
  base: [
    "https://mainnet.base.org",
    "https://developer-access-mainnet.base.org",
  ],
  sepolia: [
    "https://ethereum-sepolia.publicnode.com",
  ],
  mumbai: [
    "https://polygon-mumbai.publicnode.com",
  ],
  tbnb: [
    "https://bsc-testnet.publicnode.com",
  ],
  fuji: [
    "https://avalanche-fuji-c-chain.publicnode.com",
  ],
  "optimism-goerli": [
    "https://optimism-goerli.publicnode.com",
  ],
  "arbitrum-goerli": [
    "https://arbitrum-goerli.publicnode.com",
  ],
  "base-goerli": [
    "https://base-goerli.publicnode.com",
  ],
};

export function BalanceProvider({ children }) {
  const { wallet, authLoading, walletLoading } = useAuth();

  const [balances, setBalances] = useState({});
  const [prices, setPrices] = useState(FALLBACK_PRICES);
  const [loading, setLoading] = useState(true);
  const [balancesReady, setBalancesReady] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  const lastPriceFetch = useRef(0);
  const silentLoading = useRef(false);

  const retryQueue = useRef([]);
  const retryCount = useRef(0);

  const providers = useMemo(() => {
    const out = {};
    for (const [key, urls] of Object.entries(RPCS)) {
      out[key] = new FallbackProvider(
        urls.map(url => new JsonRpcProvider(url))
      );
    }
    return out;
  }, []);

  const coingeckoIds = useMemo(() => {
    return Array.from(new Set(Object.values(TOKEN_IDS))).join(",");
  }, []);

  const fetchBalances = useCallback(async () => {
    const addr = wallet?.wallet?.address;
    if (!addr) return {};

    const out = {};
    await Promise.allSettled(
      Object.entries(providers).map(async ([key, provider]) => {
        try {
          const raw = await provider.getBalance(addr, "latest");
          out[key] = parseFloat(ethers.formatEther(raw));
        } catch (err) {
          console.warn(`[BalanceContext] ❌ Failed balance fetch (${key}):`, err?.message || err);
          out[key] = 0;
        }
      })
    );
    return out;
  }, [wallet, providers]);

  const fetchPrices = useCallback(async () => {
    const now = Date.now();
    if (now - lastPriceFetch.current < PRICE_TTL) return prices;

    try {
      const res = await fetch(`/api/prices?ids=${coingeckoIds}`, { cache: "no-store" });
      const data = await res.json();
      const out = {};
      for (const [sym, id] of Object.entries(TOKEN_IDS)) {
        out[sym] = {
          usd: data[id]?.usd ?? 0,
          eur: data[id]?.eur ?? 0,
        };
      }
      lastPriceFetch.current = now;
      return out;
    } catch (err) {
      console.warn("[BalanceContext] ❌ Failed price fetch:", err?.message || err);
      return prices;
    }
  }, [coingeckoIds, prices]);

  const silentRetry = useCallback(() => {
    if (retryCount.current >= 6) {
      console.error("[BalanceContext] ❌ Max silent retries reached.");
      return;
    }

    const delay = Math.min(2 ** retryCount.current * 3000, 60000);
    console.warn(`[BalanceContext] 🔁 Silent retry in ${Math.round(delay / 1000)}s...`);

    const id = setTimeout(() => {
      fetchAll(true);
    }, delay);

    retryQueue.current.push(id);
    retryCount.current++;
  }, []);

  const fetchAll = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    silentLoading.current = true;
    try {
      const [newBalances, newPrices] = await Promise.all([
        fetchBalances(),
        fetchPrices(),
      ]);
      setBalances(newBalances);
      setPrices(newPrices);
      setLastUpdated(Date.now());
      retryCount.current = 0;
      retryQueue.current.forEach(clearTimeout);
      retryQueue.current = [];
    } catch (err) {
      console.error("[BalanceContext] ❌ fetchAll error:", err?.message || err);
      silentRetry();
    } finally {
      if (!silent) setLoading(false);
      setBalancesReady(true);
      silentLoading.current = false;
    }
  }, [fetchBalances, fetchPrices, silentRetry]);

  useEffect(() => {
    if (!authLoading && !walletLoading && wallet?.wallet?.address) {
      fetchAll();
    }
  }, [authLoading, walletLoading, wallet, fetchAll]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (!silentLoading.current) {
        fetchAll(true);
      }
    }, 30_000);

    const onVisible = debounce(() => {
      if (document.visibilityState === "visible" && !silentLoading.current) {
        fetchAll(true);
      }
    }, 300);

    document.addEventListener("visibilitychange", onVisible);

    return () => {
      clearInterval(interval);
      retryQueue.current.forEach(clearTimeout);
      retryQueue.current = [];
      onVisible.cancel();
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [fetchAll]);

  const getUsdBalance = key => (balances[key] || 0) * (prices[key]?.usd || 0);
  const getEurBalance = key => (balances[key] || 0) * (prices[key]?.eur || 0);

  return (
    <BalanceContext.Provider
      value={{
        balances,
        prices,
        loading,
        balancesReady,
        lastUpdated,
        getUsdBalance,
        getEurBalance,
        refetch: () => fetchAll(true),
      }}
    >
      {children}
    </BalanceContext.Provider>
  );
}

"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import { useAuth } from "@/contexts/AuthContext";
import { JsonRpcProvider, FallbackProvider, ethers } from "ethers";
import debounce from "lodash.debounce";
import networks from "@/data/networks";

const TOKEN_IDS = { /* kaip tavo sąrašas */ };

const FALLBACK_PRICES = Object.fromEntries(
  Object.keys(TOKEN_IDS).map(k => [k, { usd: 0, eur: 0 }])
);

const BALANCE_KEY = "nordbalticum_balances";
const PRICE_KEY = "nordbalticum_prices";
const PRICE_TTL = 30_000;

const BalanceContext = createContext(null);
export const useBalance = () => useContext(BalanceContext);

export function BalanceProvider({ children }) {
  const { wallet, authLoading, walletLoading } = useAuth();

  const [balances, setBalances] = useState({});
  const [prices, setPrices] = useState(FALLBACK_PRICES);
  const [loading, setLoading] = useState(true);      // Tik pirmas inicialinis kraunasi
const [refreshing, setRefreshing] = useState(false); // Silent background
const [userTriggeredRefresh, setUserTriggeredRefresh] = useState(false); // 🔥 Naujas

// Kai nori useris refreshint rankiniu būdu:
const refetch = useCallback(async () => {
  setUserTriggeredRefresh(true);
  await fetchAll(false);
  setUserTriggeredRefresh(false);
}, [fetchAll]);
  
  const lastPriceFetch = useRef(0);

  const providers = useMemo(() => {
    const map = {};
    for (const net of networks) {
      map[net.value] = new FallbackProvider(
        net.rpcUrls.map(url => new JsonRpcProvider(url)), 1
      );
      if (net.testnet) {
        map[net.testnet.value] = new FallbackProvider(
          net.testnet.rpcUrls.map(url => new JsonRpcProvider(url)), 1
        );
      }
    }
    return map;
  }, []);

  const coingeckoIds = useMemo(
    () => Array.from(new Set(Object.values(TOKEN_IDS))).join(","),
    []
  );

  const fetchBalances = useCallback(async () => {
    const addr = wallet?.wallet?.address;
    if (!addr) return {};

    const out = {};

    await Promise.all(
      Object.entries(providers).map(async ([key, provider]) => {
        try {
          const raw = await provider.getBalance(addr, "latest");
          out[key] = parseFloat(ethers.formatEther(raw));
        } catch {
          out[key] = balances[key] ?? 0;
        }
      })
    );

    return out;
  }, [wallet, providers, balances]);

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
    } catch {
      return prices;
    }
  }, [coingeckoIds, prices]);

  const fetchAll = useCallback(async (isUserTriggered = false) => {
  if (isUserTriggered) setLoading(true); // ⬅️ Tik jei pats user
  try {
    await Promise.all([fetchBalances(), fetchPrices()]);
  } finally {
    if (isUserTriggered) setLoading(false);
  }
}, [fetchBalances, fetchPrices]);
  
    const [newBalances, newPrices] = await Promise.all([
      fetchBalances(),
      fetchPrices(),
    ]);

    setBalances(newBalances);
    setPrices(newPrices);

    if (!isSilent) {
      setLoading(false);
    } else {
      setRefreshing(false);
    }
  }, [fetchBalances, fetchPrices]);

  useEffect(() => {
  if (!authLoading && !walletLoading && wallet?.wallet?.address) {
    fetchAll(true); // ⬅️ Pradinis inicialinis load
  }
  // ⚡ NEĮRAŠYK `fetchAll` į priklausomybes čia! Tik authLoading, walletLoading.
}, [authLoading, walletLoading, wallet]);

  useEffect(() => {
    const interval = setInterval(() => {
      fetchAll(true);
    }, 30_000);

    const onVis = debounce(() => {
      if (document.visibilityState === "visible") fetchAll(true);
    }, 300);

    document.addEventListener("visibilitychange", onVis);
    return () => {
      clearInterval(interval);
      onVis.cancel();
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [fetchAll]);

  const getUsdBalance = (key) => (balances[key] || 0) * (prices[key]?.usd || 0);
  const getEurBalance = (key) => (balances[key] || 0) * (prices[key]?.eur || 0);

  return (
    <BalanceContext.Provider
      value={{
        balances,
        prices,
        loading,
        refreshing, // ⬅️ naujas statusas
        getUsdBalance,
        getEurBalance,
        refetch: () => fetchAll(false),
      }}
    >
      {children}
    </BalanceContext.Provider>
  );
}

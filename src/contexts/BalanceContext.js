// src/contexts/BalanceContext.js
"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { JsonRpcProvider, ethers } from "ethers";
import networks from "@/data/networks";

// CoinGecko IDs for all chains (mainnets & testnets)
const TOKEN_IDS = {
  eth: "ethereum", matic: "polygon-pos", bnb: "binancecoin",
  avax: "avalanche-2", optimism: "optimism", arbitrum: "arbitrum-one",
  base: "base", zksync: "zksync", linea: "linea", scroll: "scroll",
  mantle: "mantle", celo: "celo", gnosis: "xdai",
  sepolia: "ethereum", mumbai: "polygon-pos", tbnb: "binancecoin",
  fuji: "avalanche-2", "optimism-goerli": "optimism",
  "arbitrum-goerli": "arbitrum-one", "base-goerli": "base",
  "zksync-testnet": "zksync", "linea-testnet": "linea",
  "scroll-testnet": "scroll", "mantle-testnet": "mantle",
  alfajores: "celo", chiado: "xdai",
};

const FALLBACK_PRICES = Object.fromEntries(
  Object.keys(TOKEN_IDS).map(k => [k, { usd: 0, eur: 0 }])
);

const BALANCE_KEY = "nordbalticum_balances";
const PRICE_KEY   = "nordbalticum_prices";
const PRICE_TTL   = 30_000; // 30s

const BalanceContext = createContext(null);
export const useBalance = () => useContext(BalanceContext);

export function BalanceProvider({ children }) {
  const { wallet, authLoading, walletLoading } = useAuth();

  //— state
  const [balances, setBalances] = useState(() => {
    try { return JSON.parse(localStorage.getItem(BALANCE_KEY)) || {}; }
    catch { return {}; }
  });
  const [prices, setPrices] = useState(() => {
    try { return JSON.parse(localStorage.getItem(PRICE_KEY)) || FALLBACK_PRICES; }
    catch { return FALLBACK_PRICES; }
  });
  const [loading, setLoading] = useState(true);
  const lastPriceFetch = React.useRef(0);

  //— single-provider per network (public URL first)
  const providers = useMemo(() => {
    const m = {};
    networks.forEach(n => {
      m[n.value] = new JsonRpcProvider(n.rpcUrls[0]);
      if (n.testnet) m[n.testnet.value] = new JsonRpcProvider(n.testnet.rpcUrls[0]);
    });
    return m;
  }, []);

  //— dedupe CoinGecko IDs
  const coingeckoIds = useMemo(
    () => Array.from(new Set(Object.values(TOKEN_IDS))).join(","), []
  );

  //— fetch on-chain balances
  const fetchBalances = useCallback(async () => {
    const addr = wallet?.wallet?.address;
    if (!addr) return;
    const out = {};
    await Promise.all(Object.entries(providers).map(async ([key, prov]) => {
      try {
        const raw = await prov.getBalance(addr);
        out[key] = parseFloat(ethers.formatEther(raw));
      } catch {
        out[key] = balances[key] ?? 0;
      }
    }));
    setBalances(out);
    localStorage.setItem(BALANCE_KEY, JSON.stringify(out));
  }, [wallet, providers, balances]);

  //— fetch fiat prices via your proxy (/api/prices)
  const fetchPrices = useCallback(async () => {
    const now = Date.now();
    if (now - lastPriceFetch.current < PRICE_TTL) return;
    try {
      const res = await fetch(`/api/prices?ids=${coingeckoIds}`, { cache: "no-store" });
      const data = await res.json();
      const pd = {};
      Object.entries(TOKEN_IDS).forEach(([sym, id]) => {
        pd[sym] = {
          usd: data[id]?.usd ?? FALLBACK_PRICES[sym].usd,
          eur: data[id]?.eur ?? FALLBACK_PRICES[sym].eur,
        };
      });
      setPrices(pd);
      localStorage.setItem(PRICE_KEY, JSON.stringify(pd));
      lastPriceFetch.current = now;
    } catch {
      /* keep old prices */
    }
  }, [coingeckoIds]);

  //— run both
  const fetchAll = useCallback(async () => {
    setLoading(true);
    await Promise.all([fetchBalances(), fetchPrices()]);
    setLoading(false);
  }, [fetchBalances, fetchPrices]);

  //— initial trigger
  useEffect(() => {
    if (!authLoading && !walletLoading) fetchAll();
  }, [authLoading, walletLoading, fetchAll]);

  //— refetch every 30s + on visible
  useEffect(() => {
    const iv = setInterval(fetchAll, 30_000);
    const onVis = debounce(() => {
      if (document.visibilityState === "visible") fetchAll();
    }, 300);
    document.addEventListener("visibilitychange", onVis);
    return () => {
      clearInterval(iv);
      onVis.cancel();
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [fetchAll]);

  //— helpers
  const getUsdBalance = useCallback(
    net => ((balances[net] ?? 0) * (prices[net]?.usd ?? 0)).toFixed(2),
    [balances, prices]
  );
  const getEurBalance = useCallback(
    net => ((balances[net] ?? 0) * (prices[net]?.eur ?? 0)).toFixed(2),
    [balances, prices]
  );

  return (
    <BalanceContext.Provider value={{
      balances, prices, loading,
      getUsdBalance, getEurBalance,
      refetch: fetchAll,
    }}>
      {children}
    </BalanceContext.Provider>
  );
}

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

const TOKEN_IDS = {
  eth: "ethereum",
  matic: "polygon-pos",
  bnb: "binancecoin",
  avax: "avalanche-2",
  optimism: "optimism",
  arbitrum: "arbitrum-one",
  base: "base",
  zksync: "zksync",
  linea: "linea",
  scroll: "scroll",
  mantle: "mantle",
  celo: "celo",
  gnosis: "xdai",
  sepolia: "ethereum",
  mumbai: "polygon-pos",
  tbnb: "binancecoin",
  fuji: "avalanche-2",
  "optimism-goerli": "optimism",
  "arbitrum-goerli": "arbitrum-one",
  "base-goerli": "base",
  "zksync-testnet": "zksync",
  "linea-testnet": "linea",
  "scroll-testnet": "scroll",
  "mantle-testnet": "mantle",
  alfajores: "celo",
  chiado: "xdai",
};

const FALLBACK_PRICES = Object.fromEntries(
  Object.keys(TOKEN_IDS).map((k) => [k, { usd: 0, eur: 0 }])
);

const BALANCE_KEY = "nordbalticum_balances";
const PRICE_KEY = "nordbalticum_prices";
const PRICE_TTL = 30_000; // 30 sec

const BalanceContext = createContext(null);
export const useBalance = () => useContext(BalanceContext);

export function BalanceProvider({ children }) {
  const { wallet, authLoading, walletLoading } = useAuth();

  const [balances, setBalances] = useState({});
  const [prices, setPrices] = useState(FALLBACK_PRICES);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);

  const lastPriceFetch = useRef(0);

  const providers = useMemo(() => {
    const map = {};
    for (const net of networks) {
      map[net.value] = new FallbackProvider(
        net.rpcUrls.map((url) => new JsonRpcProvider(url)), 1
      );
      if (net.testnet) {
        map[net.testnet.value] = new FallbackProvider(
          net.testnet.rpcUrls.map((url) => new JsonRpcProvider(url)), 1
        );
      }
    }
    return map;
  }, []);

  const coingeckoIds = useMemo(() => {
    return Array.from(new Set(Object.values(TOKEN_IDS))).join(",");
  }, []);

  const fetchBalances = useCallback(async () => {
    const addr = wallet?.wallet?.address;
    if (!addr) return {};

    const out = {};
    await Promise.all(
      Object.entries(providers).map(async ([key, provider]) => {
        try {
          const raw = await provider.getBalance(addr, "latest");
          out[key] = parseFloat(ethers.formatEther(raw));
        } catch (err) {
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

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const [newBalances, newPrices] = await Promise.all([
      fetchBalances(),
      fetchPrices(),
    ]);
    setBalances(newBalances);
    setPrices(newPrices);
    setLastUpdated(Date.now());
    setLoading(false);
  }, [fetchBalances, fetchPrices]);

  useEffect(() => {
    if (!authLoading && !walletLoading && wallet?.wallet?.address) {
      fetchAll();
    }
  }, [authLoading, walletLoading, wallet, fetchAll]);

  useEffect(() => {
    const interval = setInterval(fetchAll, 30_000);
    const onVisible = debounce(() => {
      if (document.visibilityState === "visible") fetchAll();
    }, 300);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(interval);
      onVisible.cancel();
      document.removeEventListener("visibilitychange", onVisible);
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
        lastUpdated,
        getUsdBalance,
        getEurBalance,
        refetch: fetchAll,
      }}
    >
      {children}
    </BalanceContext.Provider>
  );
}

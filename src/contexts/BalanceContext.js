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

// ── CoinGecko IDs ───────────────────────────────────────────
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

// ── Fallback prices ─────────────────────────────────────────
const FALLBACK_PRICES = Object.fromEntries(
  Object.keys(TOKEN_IDS).map(k => [k, { usd: 0, eur: 0 }])
);

const BALANCE_KEY = "nordbalticum_balances";
const PRICE_KEY = "nordbalticum_prices";
const PRICE_TTL = 30_000; // 30 seconds

const BalanceContext = createContext(null);

export const useBalance = () => useContext(BalanceContext);

export function BalanceProvider({ children }) {
  const { wallet, authLoading, walletLoading } = useAuth();

  const [balances, setBalances] = useState(() => {
    if (typeof window === "undefined") return {};
    try {
      return JSON.parse(localStorage.getItem(BALANCE_KEY)) || {};
    } catch {
      return {};
    }
  });

  const [prices, setPrices] = useState(() => {
    if (typeof window === "undefined") return FALLBACK_PRICES;
    try {
      return JSON.parse(localStorage.getItem(PRICE_KEY)) || FALLBACK_PRICES;
    } catch {
      return FALLBACK_PRICES;
    }
  });

  const [loading, setLoading] = useState(true);
  const lastPriceFetch = useRef(0);

  // ── Providers map ───────────────────────────────────────────
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

  // ── Fetch on-chain balances ─────────────────────────────────
  const fetchBalances = useCallback(async () => {
    const addr = wallet?.wallet?.address;
    if (!addr) return;
    const out = {};

    await Promise.all(
      Object.entries(providers).map(async ([key, provider]) => {
        try {
          const raw = await provider.getBalance(addr, "latest"); // 🔥 Correct usage!
          out[key] = parseFloat(ethers.formatEther(raw));
        } catch (err) {
          console.warn(`[BalanceContext] Failed to fetch balance for ${key}:`, err?.message || err);
          out[key] = balances[key] ?? 0;
        }
      })
    );

    setBalances(out);
    if (typeof window !== "undefined") {
      localStorage.setItem(BALANCE_KEY, JSON.stringify(out));
    }
  }, [wallet, providers, balances]);

  // ── Fetch fiat prices ───────────────────────────────────────
  const fetchPrices = useCallback(async () => {
    const now = Date.now();
    if (now - lastPriceFetch.current < PRICE_TTL) return;
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

      setPrices(out);
      if (typeof window !== "undefined") {
        localStorage.setItem(PRICE_KEY, JSON.stringify(out));
      }
      lastPriceFetch.current = now;
    } catch (err) {
      console.warn("[BalanceContext] Failed to fetch prices:", err?.message || err);
    }
  }, [coingeckoIds]);

  // ── Parallel fetch all ──────────────────────────────────────
  const fetchAll = useCallback(async () => {
    setLoading(true);
    await Promise.all([fetchBalances(), fetchPrices()]);
    setLoading(false);
  }, [fetchBalances, fetchPrices]);

  // ── Initial load after wallet ready ─────────────────────────
  useEffect(() => {
    if (!authLoading && !walletLoading) {
      fetchAll();
    }
  }, [authLoading, walletLoading, fetchAll]);

  // ── Auto-refresh balances every 30s and on tab focus ────────
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

  // ── Balance to fiat converters ──────────────────────────────
  const getUsdBalance = (networkKey) => {
    const bal = balances[networkKey] || 0;
    const price = prices[networkKey]?.usd || 0;
    return bal * price;
  };

  const getEurBalance = (networkKey) => {
    const bal = balances[networkKey] || 0;
    const price = prices[networkKey]?.eur || 0;
    return bal * price;
  };

  // ── Provide context ─────────────────────────────────────────
  return (
    <BalanceContext.Provider
      value={{
        balances,
        prices,
        loading,
        getUsdBalance,
        getEurBalance,
        refetch: fetchAll,
      }}
    >
      {children}
    </BalanceContext.Provider>
  );
}

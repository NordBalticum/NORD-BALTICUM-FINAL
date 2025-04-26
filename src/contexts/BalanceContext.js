// src/contexts/BalanceContext.js
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

// ── CoinGecko slugs for each network (mainnets & testnets) ──────────
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

// zero‐prices fallback
const FALLBACK_PRICES = Object.fromEntries(
  Object.keys(TOKEN_IDS).map((k) => [k, { usd: 0, eur: 0 }])
);

const BALANCE_KEY = "nordbalticum_balances";
const PRICE_KEY = "nordbalticum_prices";
const PRICE_TTL = 30_000; // 30 seconds

const BalanceContext = createContext(null);
export const useBalance = () => useContext(BalanceContext);

export function BalanceProvider({ children }) {
  const { wallet, authLoading, walletLoading } = useAuth();

  // ── 1) State with localStorage hydration ─────────────────────
  const [balances, setBalances] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(BALANCE_KEY)) || {};
    } catch {
      return {};
    }
  });
  const [prices, setPrices] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(PRICE_KEY)) || FALLBACK_PRICES;
    } catch {
      return FALLBACK_PRICES;
    }
  });
  const [loading, setLoading] = useState(true);
  const lastPriceFetch = useRef(0);

  // ── 2) Build a FallbackProvider per chain & testnet ──────────
  const providers = useMemo(() => {
    const map = {};
    networks.forEach((n) => {
      // take both rpcUrls from networks.js (public,1RPC)
      const mainProviders = n.rpcUrls.map((url) => new JsonRpcProvider(url));
      map[n.value] = new FallbackProvider(mainProviders, 1);
      if (n.testnet) {
        const testProviders = n.testnet.rpcUrls.map((url) => new JsonRpcProvider(url));
        map[n.testnet.value] = new FallbackProvider(testProviders, 1);
      }
    });
    return map;
  }, []);

  // ── 3) Dedupe CoinGecko IDs ─────────────────────────────────
  const coingeckoIds = useMemo(
    () => Array.from(new Set(Object.values(TOKEN_IDS))).join(","),
    []
  );

  // ── 4a) Fetch on-chain balances ──────────────────────────────
  const fetchBalances = useCallback(async () => {
    const addr = wallet?.wallet?.address;
    if (!addr) return;
    const out = {};
    await Promise.all(
      Object.entries(providers).map(async ([key, prov]) => {
        try {
          const raw = await prov.getBalance(addr);
          out[key] = parseFloat(ethers.formatEther(raw));
        } catch {
          out[key] = balances[key] ?? 0;
        }
      })
    );
    setBalances(out);
    localStorage.setItem(BALANCE_KEY, JSON.stringify(out));
  }, [wallet, providers, balances]);

  // ── 4b) Fetch fiat prices (with TTL) via `/api/prices` proxy ──
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
      // keep previous prices on error
    }
  }, [coingeckoIds]);

  // ── 5) Run both in parallel ─────────────────────────────────
  const fetchAll = useCallback(async () => {
    setLoading(true);
    await Promise.all([fetchBalances(), fetchPrices()]);
    setLoading(false);
  }, [fetchBalances, fetchPrices]);

  // ── 6) Initial trigger after auth+wallet ready ──────────────
  useEffect(() => {
    if (!authLoading && !walletLoading) fetchAll();
  }, [authLoading, walletLoading, fetchAll]);

  // ── 7) Poll every 30s & on tab visibility ───────────────────
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

  // ── 8) Helpers to get USD/EUR values ────────────────────────
  const getUsdBalance = (networkKey) => {
  const val = balances[networkKey]?.usd;
  return val ? parseFloat(val) : 0;
};

const getEurBalance = (networkKey) => {
  const val = balances[networkKey]?.eur;
  return val ? parseFloat(val) : 0;
};

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

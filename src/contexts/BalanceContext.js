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

// ── CoinGecko slugs for each network ───────────────────────
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

// fallback prices
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

  // ── Setup providers per network ───────────────────────────────
  const providers = useMemo(() => {
    const map = {};
    networks.forEach((n) => {
      const main = n.rpcUrls.map((url) => new JsonRpcProvider(url));
      map[n.value] = new FallbackProvider(main, 1);
      if (n.testnet) {
        const test = n.testnet.rpcUrls.map((url) => new JsonRpcProvider(url));
        map[n.testnet.value] = new FallbackProvider(test, 1);
      }
    });
    return map;
  }, []);

  // ── Prepare CoinGecko IDs ─────────────────────────────────────
  const coingeckoIds = useMemo(
    () => Array.from(new Set(Object.values(TOKEN_IDS))).join(","),
    []
  );

  // ── Fetch balances ───────────────────────────────────────────
  const fetchBalances = useCallback(async () => {
    const addr = wallet?.wallet?.address;
    if (!addr) return;
    const out = {};
    await Promise.all(
      Object.entries(providers).map(async ([key, provider]) => {
        try {
          const raw = await provider.getBalance(addr);
          out[key] = parseFloat(ethers.formatEther(raw));
        } catch {
          out[key] = balances[key] ?? 0;
        }
      })
    );
    setBalances(out);
    localStorage.setItem(BALANCE_KEY, JSON.stringify(out));
  }, [wallet, providers, balances]);

  // ── Fetch prices ─────────────────────────────────────────────
  const fetchPrices = useCallback(async () => {
    const now = Date.now();
    if (now - lastPriceFetch.current < PRICE_TTL) return;
    try {
      const res = await fetch(`/api/prices?ids=${coingeckoIds}`, { cache: "no-store" });
      const data = await res.json();
      const out = {};
      Object.entries(TOKEN_IDS).forEach(([sym, id]) => {
        out[sym] = {
          usd: data[id]?.usd ?? 0,
          eur: data[id]?.eur ?? 0,
        };
      });
      setPrices(out);
      localStorage.setItem(PRICE_KEY, JSON.stringify(out));
      lastPriceFetch.current = now;
    } catch {
      // ignore errors, keep old prices
    }
  }, [coingeckoIds]);

  // ── Fetch all ─────────────────────────────────────────────────
  const fetchAll = useCallback(async () => {
    setLoading(true);
    await Promise.all([fetchBalances(), fetchPrices()]);
    setLoading(false);
  }, [fetchBalances, fetchPrices]);

  // ── Load when ready ───────────────────────────────────────────
  useEffect(() => {
    if (!authLoading && !walletLoading) {
      fetchAll();
    }
  }, [authLoading, walletLoading, fetchAll]);

  // ── Auto refresh every 30s & on visibility ───────────────────
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

  // ── Balance value getters ────────────────────────────────────
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

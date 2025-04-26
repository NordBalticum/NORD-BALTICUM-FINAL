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

const PRICE_TTL = 30_000;
const BalanceContext = createContext(null);

export const useBalance = () => useContext(BalanceContext);

export function BalanceProvider({ children }) {
  const { wallet, authLoading, walletLoading } = useAuth();

  const [balances, setBalances] = useState({});
  const [prices, setPrices] = useState(FALLBACK_PRICES);
  const [loading, setLoading] = useState(true);
  const [balancesReady, setBalancesReady] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  const lastPriceFetch = useRef(0);
  const badRpcTracker = useRef({}); // 🛡️ Neveikiantys RPC trackeris

  const providers = useMemo(() => {
    const map = {};
    for (const net of networks) {
      map[net.value] = new FallbackProvider(
        net.rpcUrls.map(url => new JsonRpcProvider(url)),
        1
      );
      if (net.testnet) {
        map[net.testnet.value] = new FallbackProvider(
          net.testnet.rpcUrls.map(url => new JsonRpcProvider(url)),
          1
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

    const out = { ...balances }; // 🔥 Iš karto turim fallback
    await Promise.all(
      Object.entries(providers).map(async ([key, provider]) => {
        if (badRpcTracker.current[key]?.blocked) {
          return; // Skip blogą tinklą
        }
        try {
          const raw = await provider.getBalance(addr, "latest");
          out[key] = parseFloat(ethers.formatEther(raw));
          badRpcTracker.current[key] = { fails: 0, blocked: false };
        } catch (err) {
          console.warn(`[BalanceContext] RPC fail for ${key}:`, err?.message || err);
          // Įskaičiuojam fail'ą
          const current = badRpcTracker.current[key] || { fails: 0, blocked: false };
          current.fails += 1;
          if (current.fails >= 3) {
            current.blocked = true;
            console.error(`[BalanceContext] RPC ${key} blocked after 3 fails 🚫`);
          }
          badRpcTracker.current[key] = current;
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
      fetchAll().then(() => {
        setBalancesReady(true);
      });
    }
  }, [authLoading, walletLoading, wallet, fetchAll]);

  useEffect(() => {
    const interval = setInterval(fetchAll, 30_000);
    const onVisible = debounce(() => {
      if (document.visibilityState === "visible") fetchAll();
    }, 300);
    document.addEventListener("visibilitychange", onVis);
    return () => {
      clearInterval(interval);
      onVisible.cancel();
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
        balancesReady,
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

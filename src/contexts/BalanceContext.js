"use client";

import React, {
  createContext, useContext, useState, useEffect,
  useCallback, useMemo, useRef
} from "react";
import { ethers, JsonRpcProvider, FallbackProvider } from "ethers";
import debounce from "lodash.debounce";

import { useAuth } from "@/contexts/AuthContext";

const BalanceContext = createContext(null);
export const useBalance = () => useContext(BalanceContext);

// 4 mainnets + 4 testnets hardcoded
const DEFAULT_NETWORKS = [
  "eth", "matic", "bnb", "avax",
  "sepolia", "mumbai", "tbnb", "fuji"
];

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

const RPCS = {
  eth: ["https://eth.llamarpc.com", "https://rpc.ankr.com/eth"],
  matic: ["https://polygon.llamarpc.com", "https://rpc.ankr.com/polygon"],
  bnb: ["https://bsc.publicnode.com", "https://rpc.ankr.com/bsc"],
  avax: ["https://api.avax.network/ext/bc/C/rpc", "https://rpc.ankr.com/avalanche"],
  optimism: ["https://optimism.publicnode.com", "https://rpc.ankr.com/optimism"],
  arbitrum: ["https://arb1.arbitrum.io/rpc", "https://rpc.ankr.com/arbitrum"],
  base: ["https://mainnet.base.org", "https://developer-access-mainnet.base.org"],
  sepolia: ["https://ethereum-sepolia.publicnode.com"],
  mumbai: ["https://polygon-mumbai.publicnode.com"],
  tbnb: ["https://bsc-testnet.publicnode.com"],
  fuji: ["https://avalanche-fuji-c-chain.publicnode.com"],
  "optimism-goerli": ["https://optimism-goerli.publicnode.com"],
  "arbitrum-goerli": ["https://arbitrum-goerli.publicnode.com"],
  "base-goerli": ["https://base-goerli.publicnode.com"],
};

const PRICE_TTL = 30000;

const format = (val, decimals = 5) => {
  if (typeof val !== "number" || isNaN(val)) return "0.00000";
  return Number(val).toFixed(decimals);
};

function getEnabledNetworks() {
  try {
    const local = JSON.parse(localStorage.getItem("enabledNetworks"));
    if (Array.isArray(local)) return [...new Set([...DEFAULT_NETWORKS, ...local])];
  } catch {}
  return DEFAULT_NETWORKS;
}

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

  const enabledNetworks = useMemo(() => getEnabledNetworks(), []);

  const providers = useMemo(() => {
    const out = {};
    for (const key of enabledNetworks) {
      const urls = RPCS[key];
      if (urls?.length) {
        out[key] = new FallbackProvider(urls.map(url => new JsonRpcProvider(url)));
      }
    }
    return out;
  }, [enabledNetworks]);

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
        } catch {
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
    } catch {
      return prices;
    }
  }, [coingeckoIds, prices]);

  const silentRetry = useCallback(() => {
    if (retryCount.current >= 6) return;
    const delay = Math.min(2 ** retryCount.current * 3000, 60000);
    const id = setTimeout(() => fetchAll(true), delay);
    retryQueue.current.push(id);
    retryCount.current++;
  }, []);

  const fetchAll = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    silentLoading.current = true;
    try {
      const [newBalances, newPrices] = await Promise.all([fetchBalances(), fetchPrices()]);
      setBalances(newBalances);
      setPrices(newPrices);
      setLastUpdated(Date.now());
      retryCount.current = 0;
      retryQueue.current.forEach(clearTimeout);
      retryQueue.current = [];
    } catch {
      silentRetry();
    } finally {
      if (!silent) setLoading(false);
      setBalancesReady(true);
      silentLoading.current = false;
    }
  }, [fetchBalances, fetchPrices, silentRetry]);

  useEffect(() => {
    if (!authLoading && !walletLoading && wallet?.wallet?.address) fetchAll();
  }, [authLoading, walletLoading, wallet, fetchAll]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (!silentLoading.current) fetchAll(true);
    }, 30000);

    const onVisible = debounce(() => {
      if (document.visibilityState === "visible" && !silentLoading.current) fetchAll(true);
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

  const getUsdBalance = key => format((balances[key] || 0) * (prices[key]?.usd || 0), 2);
  const getEurBalance = key => format((balances[key] || 0) * (prices[key]?.eur || 0), 2);
  const getFormattedBalance = key => format(balances[key] || 0);

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
        getFormattedBalance,
        refetch: () => fetchAll(true),
      }}
    >
      {children}
    </BalanceContext.Provider>
  );
}

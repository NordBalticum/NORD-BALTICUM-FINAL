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

import networks from "@/data/networks"; // your 26-chain list

// ── CoinGecko token slugs ───────────────────────────────────────
const TOKEN_IDS = {
  eth:               "ethereum",
  matic:             "polygon-pos",
  bnb:               "binancecoin",
  avax:              "avalanche-2",
  optimism:          "optimism",
  arbitrum:          "arbitrum-one",
  base:              "base",
  zksync:            "zksync",
  linea:             "linea",
  scroll:            "scroll",
  mantle:            "mantle",
  celo:              "celo",
  gnosis:            "xdai",
  // testnets → map back to mainnet
  sepolia:           "ethereum",
  mumbai:            "polygon-pos",
  tbnb:              "binancecoin",
  fuji:              "avalanche-2",
  "optimism-goerli": "optimism",
  "arbitrum-goerli":"arbitrum-one",
  "base-goerli":     "base",
  "zksync-testnet":  "zksync",
  "linea-testnet":   "linea",
  "scroll-testnet":  "scroll",
  "mantle-testnet":  "mantle",
  alfajores:         "celo",
  chiado:            "xdai",
};

// fallback zero‐prices if CoinGecko fails
const FALLBACK_PRICES = Object.fromEntries(
  Object.keys(TOKEN_IDS).map((k) => [k, { usd: 0, eur: 0 }])
);

// localStorage keys & price TTL
const BALANCE_KEY = "nordbalticum_balances";
const PRICE_KEY   = "nordbalticum_prices";
const PRICE_TTL   = 30_000; // 30 seconds

const BalanceContext = createContext(null);
export const useBalance = () => useContext(BalanceContext);

export function BalanceProvider({ children }) {
  const { wallet, authLoading, walletLoading } = useAuth();

  const [balances, setBalances] = useState({});
  const [prices,   setPrices]   = useState(FALLBACK_PRICES);
  const [loading,  setLoading]  = useState(true);
  const lastPricesFetch = useRef(0);

  // localStorage helpers
  const save = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };
  const load = (k)    => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : null; } catch { return null; } };

  // 1) Build a FallbackProvider for each chain
  const providers = useMemo(() => {
    const map = {};
    for (const net of networks) {
      const makeProv = (urls) => {
        const provs = urls.map((u) => new JsonRpcProvider(u));
        return new FallbackProvider(provs, urls.length);
      };
      map[net.value] = makeProv(net.rpcUrls);
      if (net.testnet) {
        map[net.testnet.value] = makeProv(net.testnet.rpcUrls);
      }
    }
    return map;
  }, []);

  // 2) Dedupe CoinGecko IDs
  const cgIds = useMemo(() => Array.from(new Set(Object.values(TOKEN_IDS))).join(","), []);

  // 3a) Fetch on‐chain balances
  const fetchBalances = useCallback(async () => {
    const addr = wallet?.wallet?.address;
    if (!addr) return;
    const entries = await Promise.all(
      Object.entries(providers).map(async ([key, prov]) => {
        try {
          const raw = await prov.getBalance(addr);
          return [key, parseFloat(ethers.formatEther(raw))];
        } catch {
          return [key, balances[key] ?? 0];
        }
      })
    );
    const result = Object.fromEntries(entries);
    setBalances(result);
    save(BALANCE_KEY, result);
  }, [wallet, providers, balances]);

  // 3b) Fetch fiat prices (via your next.js proxy at /api/prices)
  const fetchPrices = useCallback(async () => {
    const now = Date.now();
    if (now - lastPricesFetch.current < PRICE_TTL) return;
    try {
      const res = await fetch(`/api/prices?ids=${cgIds}`, { cache: "no-store" });
      const json = await res.json();
      const pd = {};
      for (const [sym, id] of Object.entries(TOKEN_IDS)) {
        pd[sym] = {
          usd: json[id]?.usd ?? FALLBACK_PRICES[sym].usd,
          eur: json[id]?.eur ?? FALLBACK_PRICES[sym].eur,
        };
      }
      setPrices(pd);
      save(PRICE_KEY, pd);
      lastPricesFetch.current = now;
    } catch (e) {
      console.error("❌ CoinGecko proxy error:", e);
    }
  }, [cgIds]);

  // 4) Parallel fetch
  const fetchAll = useCallback(async () => {
    setLoading(true);
    await Promise.all([fetchBalances(), fetchPrices()]);
    setLoading(false);
  }, [fetchBalances, fetchPrices]);

  // 5) Hydrate caches on mount
  useEffect(() => {
    const cb = load(BALANCE_KEY), cp = load(PRICE_KEY);
    if (cb) setBalances(cb);
    if (cp) setPrices(cp);
  }, []);

  // 6) Initial & auth/wallet ready trigger
  useEffect(() => {
    if (!authLoading && !walletLoading) fetchAll();
  }, [authLoading, walletLoading, fetchAll]);

  // 7) Poll every 30s and also on visibility/online
  useEffect(() => {
    const iv = setInterval(fetchAll, 30_000);
    const onVis = debounce(() => { if (document.visibilityState==="visible") fetchAll(); }, 500);
    const onOnl = debounce(fetchAll, 500);
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("online", onOnl);
    return () => {
      clearInterval(iv);
      onVis.cancel(); onOnl.cancel();
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("online", onOnl);
    };
  }, [fetchAll]);

  // 8) USD/EUR helpers
  const getUsdBalance = useCallback(
    (net) => ((balances[net] ?? 0) * (prices[net]?.usd ?? 0)).toFixed(2),
    [balances, prices]
  );
  const getEurBalance = useCallback(
    (net) => ((balances[net] ?? 0) * (prices[net]?.eur ?? 0)).toFixed(2),
    [balances, prices]
  );

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

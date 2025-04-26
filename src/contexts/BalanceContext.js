// src/contexts/BalanceContext.js
"use client";

import {
  createContext, useContext,
  useState, useEffect,
  useCallback, useMemo, useRef,
} from "react";
import { useAuth } from "@/contexts/AuthContext";
import { ethers } from "ethers";
import debounce from "lodash.debounce";

import networks from "@/data/networks";           // your 26-chain list
import { getProviderForChain } from "@/utils/getProviderForChain";

// ── CoinGecko token slugs for each network value ───────────────────────────
const TOKEN_IDS = {
  eth:              "ethereum",
  matic:            "matic-network",       // ← correct slug!
  bnb:              "binancecoin",
  avax:             "avalanche-2",
  optimism:         "optimism",
  arbitrum:         "arbitrum-one",
  base:             "base",
  zksync:           "zksync",
  linea:            "linea",
  scroll:           "scroll",
  mantle:           "mantle",
  celo:             "celo",
  gnosis:           "xdai",
  // testnets map back to their mainnet slugs:
  sepolia:          "ethereum",
  mumbai:           "matic-network",
  tbnb:             "binancecoin",
  fuji:             "avalanche-2",
  "optimism-goerli":"optimism",
  "arbitrum-goerli":"arbitrum-one",
  "base-goerli":    "base",
  "zksync-testnet": "zksync",
  "linea-testnet":  "linea",
  "scroll-testnet": "scroll",
  "mantle-testnet": "mantle",
  alfajores:        "celo",
  chiado:           "xdai",
};

// fallback zero‐prices if CG is unreachable
const FALLBACK_PRICES = Object.fromEntries(
  Object.keys(TOKEN_IDS).map(k => [k, { usd: 0, eur: 0 }])
);

const BALANCE_KEY = "nordbalticum_balances";
const PRICE_KEY   = "nordbalticum_prices";

const BalanceContext = createContext(null);
export const useBalance = () => useContext(BalanceContext);

export function BalanceProvider({ children }) {
  const { wallet, authLoading, walletLoading } = useAuth();

  const [balances, setBalances] = useState({});
  const [prices,   setPrices]   = useState(FALLBACK_PRICES);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);

  // refs for last known state
  const lastBalances = useRef({});
  const lastFetch    = useRef(0);

  // simple localStorage caching
  const save = (k,v) => {
    try { localStorage.setItem(k, JSON.stringify(v)); }
    catch {}
  };
  const load = k => {
    try {
      const v = localStorage.getItem(k);
      return v ? JSON.parse(v) : null;
    } catch { return null; }
  };

  // build one ethers provider per network
  const providers = useMemo(() => {
    const m = {};
    for (const net of networks) {
      try {
        m[net.value] = getProviderForChain(net.chainId);
        if (net.testnet) {
          m[net.testnet.value] = getProviderForChain(net.testnet.chainId);
        }
      } catch (e) {
        console.warn(`Provider init failed for ${net.value}`, e);
      }
    }
    return m;
  }, []);

  // dedupe our CoinGecko query string
  const coingeckoQuery = useMemo(() =>
    Array.from(new Set(Object.values(TOKEN_IDS))).join(","),
  []);

  // fetch on‐chain balances
  const fetchBalances = useCallback(async () => {
    const addr = wallet?.wallet?.address;
    if (!addr) return;
    const entries = await Promise.all(
      Object.entries(providers).map(async ([key, prov]) => {
        try {
          const v = await prov.getBalance(addr);
          return [key, parseFloat(ethers.formatEther(v))];
        } catch {
          return [key, lastBalances.current[key] ?? 0];
        }
      })
    );
    const nb = Object.fromEntries(entries);
    setBalances(nb);
    lastBalances.current = nb;
    save(BALANCE_KEY, nb);
  }, [wallet, providers]);

  // fetch fiat prices from CoinGecko
  const fetchPrices = useCallback(async () => {
    try {
      const resp = await fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=${coingeckoQuery}&vs_currencies=usd,eur`,
        { cache: "no-store" }
      );
      const json = await resp.json();
      const pd = {};
      for (const [sym, id] of Object.entries(TOKEN_IDS)) {
        pd[sym] = {
          usd: json[id]?.usd ?? FALLBACK_PRICES[sym].usd,
          eur: json[id]?.eur ?? FALLBACK_PRICES[sym].eur,
        };
      }
      setPrices(pd);
      save(PRICE_KEY, pd);
    } catch (e) {
      console.error("CoinGecko fetch failed:", e);
      // leave prices at whatever they were (or fallback)
    }
  }, [coingeckoQuery]);

  // kick both off in parallel
  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await Promise.all([ fetchBalances(), fetchPrices() ]);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
      lastFetch.current = Date.now();
    }
  }, [fetchBalances, fetchPrices]);

  // hydrate from cache on mount
  useEffect(() => {
    const cb = load(BALANCE_KEY), cp = load(PRICE_KEY);
    if (cb) { setBalances(cb); lastBalances.current = cb; }
    if (cp) setPrices(cp);
  }, []);

  // as soon as auth+wallet are ready
  useEffect(() => {
    if (!authLoading && !walletLoading) {
      fetchAll();
    }
  }, [authLoading, walletLoading, fetchAll]);

  // poll every 30s
  useEffect(() => {
    if (!wallet?.wallet?.address) return;
    const iv = setInterval(fetchAll, 30_000);
    return () => clearInterval(iv);
  }, [wallet, fetchAll]);

  // re-fetch on focus or reconnect
  useEffect(() => {
    const onVis = debounce(() => {
      if (document.visibilityState === "visible") fetchAll();
    }, 500);
    const onOnl = debounce(fetchAll, 500);
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("online", onOnl);
    return () => {
      onVis.cancel(); onOnl.cancel();
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("online", onOnl);
    };
  }, [fetchAll]);

  // helpers for USD/EUR
  const getUsdBalance = useCallback((net) => {
    const b = balances[net] ?? lastBalances.current[net] ?? 0;
    const p = prices[net]?.usd     ?? 0;
    return (b * p).toFixed(2);
  }, [balances, prices]);

  const getEurBalance = useCallback((net) => {
    const b = balances[net] ?? lastBalances.current[net] ?? 0;
    const p = prices[net]?.eur     ?? 0;
    return (b * p).toFixed(2);
  }, [balances, prices]);

  return (
    <BalanceContext.Provider value={{
      balances,
      prices,
      loading,
      error,
      getUsdBalance,
      getEurBalance,
      refetch: fetchAll,
    }}>
      {children}
    </BalanceContext.Provider>
  );
}

// src/contexts/BalanceContext.js
"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import { useAuth } from "@/contexts/AuthContext";
import { ethers } from "ethers";
import debounce from "lodash.debounce";

import networks from "@/data/networks";           // your 26-chain list
import { getProviderForChain } from "@/utils/getProviderForChain";

// ── CoinGecko token slugs for all networks (main & testnets) ─────────
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
  // testnets map back to their mainnet token slug:
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

// Fallback zero‐prices if CoinGecko is down
const FALLBACK_PRICES = Object.fromEntries(
  Object.keys(TOKEN_IDS).map(sym => [sym, { usd: 0, eur: 0 }])
);

// localStorage keys
const BALANCE_KEY = "nordbalticum_balances";
const PRICE_KEY   = "nordbalticum_prices";

// how long to cache CoinGecko prices (ms)
const PRICE_TTL   = 30_000;

// optional Pro‐tier header
const CG_KEY = process.env.NEXT_PUBLIC_COINGECKO_KEY || "";

const BalanceContext = createContext(null);
export const useBalance = () => useContext(BalanceContext);

export function BalanceProvider({ children }) {
  const { wallet, authLoading, walletLoading } = useAuth();

  const [balances, setBalances] = useState({});
  const [prices,   setPrices]   = useState(FALLBACK_PRICES);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);

  // in-memory refs
  const lastBalances   = useRef({});
  const lastPriceFetch = useRef(0);

  // simple localStorage helpers
  const save = (key, val) => {
    try { localStorage.setItem(key, JSON.stringify(val)); }
    catch {}
  };
  const load = key => {
    try {
      const v = localStorage.getItem(key);
      return v ? JSON.parse(v) : null;
    } catch {
      return null;
    }
  };

  // 1) build one ethers provider per network.value
  const providers = useMemo(() => {
    const m = {};
    for (const net of networks) {
      try {
        m[net.value] = getProviderForChain(net.chainId);
        if (net.testnet) {
          m[net.testnet.value] = getProviderForChain(net.testnet.chainId);
        }
      } catch (e) {
        console.warn(`⚠️ Provider init failed for ${net.value}:`, e);
      }
    }
    return m;
  }, []);

  // 2) one deduped comma‐list for CoinGecko
  const coingeckoQuery = useMemo(
    () => Array.from(new Set(Object.values(TOKEN_IDS))).join(","),
    []
  );

  // 3a) fetch and cache CoinGecko prices, respecting TTL
  const fetchPrices = useCallback(async () => {
    const now = Date.now();
    if (now - lastPriceFetch.current < PRICE_TTL) return;
    try {
      const url = `https://api.coingecko.com/api/v3/simple/price?ids=${coingeckoQuery}&vs_currencies=usd,eur`;
      const resp = await fetch(url, {
        cache: "no-store",
        headers: CG_KEY ? { "x-cg-pro-api-key": CG_KEY } : {},
      });
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
      lastPriceFetch.current = now;
    } catch (e) {
      console.error("❌ CoinGecko fetch failed:", e);
    }
  }, [coingeckoQuery]);

  // 3b) fetch on‐chain balances
  const fetchBalances = useCallback(async () => {
    const addr = wallet?.wallet?.address;
    if (!addr) return;
    try {
      const entries = await Promise.all(
        Object.entries(providers).map(async ([net, prov]) => {
          try {
            const raw = await prov.getBalance(addr);
            return [net, parseFloat(ethers.formatEther(raw))];
          } catch {
            // fallback to last known
            return [net, lastBalances.current[net] ?? 0];
          }
        })
      );
      const nb = Object.fromEntries(entries);
      setBalances(nb);
      lastBalances.current = nb;
      save(BALANCE_KEY, nb);
    } catch (e) {
      console.error("❌ Balance fetch failed:", e);
    }
  }, [wallet, providers]);

  // 4) run both in parallel
  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await Promise.all([ fetchBalances(), fetchPrices() ]);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [fetchBalances, fetchPrices]);

  // 5) hydrate from localStorage on mount
  useEffect(() => {
    const cb = load(BALANCE_KEY), cp = load(PRICE_KEY);
    if (cb) { setBalances(cb); lastBalances.current = cb; }
    if (cp) setPrices(cp);
  }, []);

  // 6) initial fetch once auth & wallet are ready
  useEffect(() => {
    if (!authLoading && !walletLoading) {
      fetchAll();
    }
  }, [authLoading, walletLoading, wallet, fetchAll]);

  // 7) poll every 30s
  useEffect(() => {
    if (!wallet?.wallet?.address) return;
    const iv = setInterval(fetchAll, 30_000);
    return () => clearInterval(iv);
  }, [wallet, fetchAll]);

  // 8) refresh on page‐focus or reconnect
  useEffect(() => {
    const onVis = debounce(() => {
      if (document.visibilityState === "visible") fetchAll();
    }, 500);
    const onOnl = debounce(fetchAll, 500);
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("online", onOnl);
    return () => {
      onVis.cancel();
      onOnl.cancel();
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("online", onOnl);
    };
  }, [fetchAll]);

  // 9) USD/EUR helpers
  const getUsdBalance = useCallback(
    net => {
      const b = balances[net] ?? lastBalances.current[net] ?? 0;
      const p = prices[net]?.usd ?? 0;
      return (b * p).toFixed(2);
    },
    [balances, prices]
  );
  const getEurBalance = useCallback(
    net => {
      const b = balances[net] ?? lastBalances.current[net] ?? 0;
      const p = prices[net]?.eur ?? 0;
      return (b * p).toFixed(2);
    },
    [balances, prices]
  );

  return (
    <BalanceContext.Provider
      value={{
        balances,
        prices,
        loading,
        error,
        lastUpdated: lastPriceFetch.current,
        getUsdBalance,
        getEurBalance,
        refetch: fetchAll,
      }}
    >
      {children}
    </BalanceContext.Provider>
  );
}

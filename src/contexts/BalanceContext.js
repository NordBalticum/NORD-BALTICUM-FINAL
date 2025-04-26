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

import networks from "@/data/networks";
import { getProviderForChain } from "@/utils/getProviderForChain";

// ── CoinGecko slugs ───────────────────────────────────────────
const TOKEN_IDS = {
  eth:              "ethereum",
  matic:            "polygon-pos",       // corrected!
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
  // testnets → mainnet slugs
  sepolia:          "ethereum",
  mumbai:           "polygon-pos",
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

  const lastBalances   = useRef({});
  const lastFetchTime  = useRef(0);

  // localStorage helpers
  const save = (k,v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch{} };
  const load = k => {
    try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : null; }
    catch { return null; }
  };

  // 1) providers for each chain
  const providers = useMemo(() => {
    const m = {};
    for (const net of networks) {
      m[net.value] = getProviderForChain(net.chainId);
      if (net.testnet) {
        m[net.testnet.value] = getProviderForChain(net.testnet.chainId);
      }
    }
    return m;
  }, []);

  // 2) unique list for CG
  const coingeckoQuery = useMemo(
    () => Array.from(new Set(Object.values(TOKEN_IDS))).join(","),
    []
  );

  // 3a) on‐chain balances
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

  // 3b) CG prices
  const fetchPrices = useCallback(async () => {
    try {
      const resp = await fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=${coingeckoQuery}&vs_currencies=usd,eur`,
        { cache: "no-store" }
      );
      const j = await resp.json();
      const pd = {};
      for (const [sym, id] of Object.entries(TOKEN_IDS)) {
        pd[sym] = {
          usd: j[id]?.usd ?? FALLBACK_PRICES[sym].usd,
          eur: j[id]?.eur ?? FALLBACK_PRICES[sym].eur,
        };
      }
      setPrices(pd);
      save(PRICE_KEY, pd);
    } catch (e) {
      console.error("CoinGecko fetch failed:", e);
    }
  }, [coingeckoQuery]);

  // 4) run both
  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await Promise.all([fetchBalances(), fetchPrices()]);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
      lastFetchTime.current = Date.now();
    }
  }, [fetchBalances, fetchPrices]);

  // 5) hydrate cache
  useEffect(() => {
    const cb = load(BALANCE_KEY), cp = load(PRICE_KEY);
    if (cb) { setBalances(cb); lastBalances.current = cb; }
    if (cp) setPrices(cp);
  }, []);

  // 6) initial fetch
  useEffect(() => {
    if (!authLoading && !walletLoading) fetchAll();
  }, [authLoading, walletLoading, fetchAll]);

  // 7) poll every 30s
  useEffect(() => {
    if (!wallet?.wallet?.address) return;
    const iv = setInterval(fetchAll, 30_000);
    return () => clearInterval(iv);
  }, [wallet, fetchAll]);

  // 8) refetch on focus/online
  useEffect(() => {
    const onVis = debounce(() => { if (document.visibilityState==="visible") fetchAll(); }, 500);
    const onOnl = debounce(fetchAll, 500);
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("online", onOnl);
    return () => {
      onVis.cancel(); onOnl.cancel();
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("online", onOnl);
    };
  }, [fetchAll]);

  // 9) helpers
  const getUsdBalance = useCallback((net) => {
    const b = balances[net] ?? lastBalances.current[net] ?? 0;
    const p = prices[net]?.usd ?? 0;
    return (b * p).toFixed(2);
  }, [balances, prices]);

  const getEurBalance = useCallback((net) => {
    const b = balances[net] ?? lastBalances.current[net] ?? 0;
    const p = prices[net]?.eur ?? 0;
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

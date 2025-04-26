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

// patikslinti slug’ai
const TOKEN_IDS = {
  eth:              "ethereum",
  matic:            "polygon-pos",
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
  const lastBalances = useRef({});
  const save = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };
  const load = k => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : null; } catch { return null; } };

  // providers
  const providers = useMemo(() => {
    const m = {};
    for (const net of networks) {
      m[net.value] = getProviderForChain(net.chainId);
      if (net.testnet) m[net.testnet.value] = getProviderForChain(net.testnet.chainId);
    }
    return m;
  }, []);

  // CoinGecko query
  const coingeckoQuery = useMemo(
    () => Array.from(new Set(Object.values(TOKEN_IDS))).join(","),
    []
  );

  // on-chain balances
  const fetchBalances = useCallback(async () => {
    if (!wallet?.wallet?.address) return;
    const addr = wallet.wallet.address;
    const entries = await Promise.all(
      Object.entries(providers).map(async ([key, prov]) => {
        try {
          const raw = await prov.getBalance(addr);
          return [key, parseFloat(ethers.formatEther(raw))];
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

  // fiat prices
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
          usd: json[id]?.usd  ?? FALLBACK_PRICES[sym].usd,
          eur: json[id]?.eur  ?? FALLBACK_PRICES[sym].eur,
        };
      }
      setPrices(pd);
      save(PRICE_KEY, pd);
    } catch (e) {
      console.error("❌ CoinGecko fetch failed:", e);
    }
  }, [coingeckoQuery]);

  // run both
  const fetchAll = useCallback(async () => {
    setLoading(true);
    await Promise.all([fetchBalances(), fetchPrices()]);
    setLoading(false);
  }, [fetchBalances, fetchPrices]);

  // hydrate cache
  useEffect(() => {
    const cb = load(BALANCE_KEY), cp = load(PRICE_KEY);
    if (cb) { setBalances(cb); lastBalances.current = cb; }
    if (cp) setPrices(cp);
  }, []);

  // initial & poll
  useEffect(() => {
    if (!authLoading && !walletLoading) fetchAll();
  }, [authLoading, walletLoading, fetchAll]);

  useEffect(() => {
    const iv = setInterval(fetchAll, 30_000);
    return () => clearInterval(iv);
  }, [fetchAll]);

  // usd/eur helpers
  const getUsdBalance = useCallback(net => {
    const b = balances[net] ?? 0, p = prices[net]?.usd ?? 0;
    return (b * p).toFixed(2);
  }, [balances, prices]);
  const getEurBalance = useCallback(net => {
    const b = balances[net] ?? 0, p = prices[net]?.eur ?? 0;
    return (b * p).toFixed(2);
  }, [balances, prices]);

  return (
    <BalanceContext.Provider value={{
      balances,
      prices,
      loading,
      getUsdBalance,
      getEurBalance,
      refetch: fetchAll,
    }}>
      {children}
    </BalanceContext.Provider>
  );
}

// src/contexts/BalanceContext.js
"use client";

import React, {
  createContext, useContext,
  useState, useEffect, useCallback, useMemo,
} from "react";
import { useAuth } from "@/contexts/AuthContext";
import { JsonRpcProvider } from "ethers";
import debounce from "lodash.debounce";

import networks from "@/data/networks"; // your 26 chains

// per‐chain→Coingecko slug
const TOKEN_IDS = {
  eth: "ethereum",
  matic: "polygon-pos",
  tbnb: "binancecoin",
  bnb: "binancecoin",
  /* …etc… */
  mumbai: "polygon-pos",
  /* …etc… */
};

// fallback
const FALLBACK_PRICES = Object.fromEntries(
  Object.keys(TOKEN_IDS).map(k => [k, { usd: 0, eur: 0 }])
);

const BALANCE_KEY = "nordbalticum_balances";
const PRICE_KEY   = "nordbalticum_prices";

const BalanceContext = createContext(null);
export const useBalance = () => useContext(BalanceContext);

export function BalanceProvider({ children }) {
  const { wallet, authLoading, walletLoading } = useAuth();

  const [balances, setBalances] = useState(() => {
    try { return JSON.parse(localStorage.getItem(BALANCE_KEY)) || {}; }
    catch { return {}; }
  });
  const [prices, setPrices] = useState(() => {
    try { return JSON.parse(localStorage.getItem(PRICE_KEY)) || FALLBACK_PRICES; }
    catch { return FALLBACK_PRICES; }
  });
  const [loading, setLoading] = useState(true);

  // build a single provider per chain/testnet
  const providers = useMemo(() => {
    const map = {};
    for (const c of networks) {
      map[c.value] = new JsonRpcProvider(c.rpcUrls[0]);
      if (c.testnet) map[c.testnet.value] = new JsonRpcProvider(c.testnet.rpcUrls[0]);
    }
    return map;
  }, []);

  // coingecko ids, deduped
  const cgIds = useMemo(
    () => Array.from(new Set(Object.values(TOKEN_IDS))).join(","),
    []
  );

  // fetch balances
  const fetchBalances = useCallback(async () => {
    if (!wallet?.wallet?.address) return;
    const addr = wallet.wallet.address;
    const out = {};
    await Promise.all(Object.entries(providers).map(async ([key, prov]) => {
      try {
        const raw = await prov.getBalance(addr);
        out[key] = parseFloat(ethers.formatEther(raw));
      } catch {
        out[key] = 0;           // <<— zero on error
      }
    }));
    setBalances(out);
    localStorage.setItem(BALANCE_KEY, JSON.stringify(out));
  }, [wallet, providers]);

  // fetch prices
  const fetchPrices = useCallback(async () => {
    try {
      const res = await fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=${cgIds}&vs_currencies=usd,eur`
      );
      const j = await res.json();
      const pd = {};
      for (const [sym, id] of Object.entries(TOKEN_IDS)) {
        pd[sym] = {
          usd: j[id]?.usd  ?? FALLBACK_PRICES[sym].usd,
          eur: j[id]?.eur  ?? FALLBACK_PRICES[sym].eur,
        };
      }
      setPrices(pd);
      localStorage.setItem(PRICE_KEY, JSON.stringify(pd));
    } catch {
      // keep old prices
    }
  }, [cgIds]);

  // run both
  const fetchAll = useCallback(async () => {
    setLoading(true);
    await Promise.all([fetchBalances(), fetchPrices()]);
    setLoading(false);
  }, [fetchBalances, fetchPrices]);

  // initial & refresh triggers
  useEffect(() => {
    if (!authLoading && !walletLoading) fetchAll();
  }, [authLoading, walletLoading, fetchAll]);

  // debounced background refetch
  useEffect(() => {
    const iv = setInterval(fetchAll, 30_000);
    const onVis = debounce(() => {
      if (document.visibilityState === "visible") fetchAll();
    }, 500);
    window.addEventListener("visibilitychange", onVis);
    return () => {
      clearInterval(iv);
      onVis.cancel();
      window.removeEventListener("visibilitychange", onVis);
    };
  }, [fetchAll]);

  // format helpers
  const getUsdBalance = useCallback(
    net => ((balances[net] ?? 0) * (prices[net]?.usd ?? 0)).toFixed(2),
    [balances, prices]
  );
  const getEurBalance = useCallback(
    net => ((balances[net] ?? 0) * (prices[net]?.eur ?? 0)).toFixed(2),
    [balances, prices]
  );

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

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

// ── CoinGecko slugs for each network (main & testnets) ──────────
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

// fallback = zero‐prices if Coingecko fails
const FALLBACK_PRICES = Object.fromEntries(
  Object.keys(TOKEN_IDS).map(k => [k, { usd: 0, eur: 0 }])
);

const BALANCE_KEY = "nordbalticum_balances";
const PRICE_KEY   = "nordbalticum_prices";
const PRICE_TTL   = 30_000; // ms

const BalanceContext = createContext(null);
export const useBalance = () => useContext(BalanceContext);

export function BalanceProvider({ children }) {
  const { wallet, authLoading, walletLoading } = useAuth();

  // hydrate from localStorage
  const [balances, setBalances] = useState(() => {
    try { return JSON.parse(localStorage.getItem(BALANCE_KEY)) || {}; }
    catch { return {}; }
  });
  const [prices, setPrices] = useState(() => {
    try { return JSON.parse(localStorage.getItem(PRICE_KEY)) || FALLBACK_PRICES; }
    catch { return FALLBACK_PRICES; }
  });
  const [loading, setLoading] = useState(true);
  const lastPriceFetch = useRef(0);

  // 1) Build a FallbackProvider for each network & testnet
  const providers = useMemo(() => {
    const map = {};
    networks.forEach((n) => {
      const main = n.rpcUrls.map(u => new JsonRpcProvider(u));
      map[n.value] = new FallbackProvider(main);
      if (n.testnet) {
        const test = n.testnet.rpcUrls.map(u => new JsonRpcProvider(u));
        map[n.testnet.value] = new FallbackProvider(test);
      }
    });
    return map;
  }, []);

  // 2) Build deduped Coingecko IDs string
  const cgIds = useMemo(
    () => Array.from(new Set(Object.values(TOKEN_IDS))).join(","),
    []
  );

  // 3a) Fetch on-chain balances
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

  // 3b) Fetch fiat prices (with TTL)
  const fetchPrices = useCallback(async () => {
    const now = Date.now();
    if (now - lastPriceFetch.current < PRICE_TTL) return;
    try {
      // Use your Next.js proxy at /api/prices?ids=... to avoid CORS
      const res = await fetch(`/api/prices?ids=${cgIds}`, { cache: "no-store" });
      const json = await res.json();
      const pd = {};
      Object.entries(TOKEN_IDS).forEach(([sym, id]) => {
        pd[sym] = {
          usd: json[id]?.usd ?? FALLBACK_PRICES[sym].usd,
          eur: json[id]?.eur ?? FALLBACK_PRICES[sym].eur,
        };
      });
      setPrices(pd);
      localStorage.setItem(PRICE_KEY, JSON.stringify(pd));
      lastPriceFetch.current = now;
    } catch {
      // keep existing prices if fetch fails
    }
  }, [cgIds]);

  // 4) Parallel fetch
  const fetchAll = useCallback(async () => {
    setLoading(true);
    await Promise.all([fetchBalances(), fetchPrices()]);
    setLoading(false);
  }, [fetchBalances, fetchPrices]);

  // 5) Initial + auth/wallet ready trigger
  useEffect(() => {
    if (!authLoading && !walletLoading) fetchAll();
  }, [authLoading, walletLoading, fetchAll]);

  // 6) Background polling + on-visible
  useEffect(() => {
    const iv = setInterval(fetchAll, 30_000);
    const onVis = debounce(() => {
      if (document.visibilityState === "visible") fetchAll();
    }, 500);
    document.addEventListener("visibilitychange", onVis);
    return () => {
      clearInterval(iv);
      onVis.cancel();
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [fetchAll]);

  // 7) Helpers
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

"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import { useAuth } from "@/contexts/AuthContext";
import { JsonRpcProvider, ethers } from "ethers";
import debounce from "lodash.debounce";
import networks from "@/data/networks"; // your 26‐chain list

// map chain.value → CoinGecko slug
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
  // testnets all map back to their main slug:
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

// fallback if CG fails
const FALLBACK_PRICES = Object.fromEntries(
  Object.keys(TOKEN_IDS).map(k => [k, { usd: 0, eur: 0 }])
);

const BALANCE_KEY = "nordbalticum_balances";
const PRICE_KEY   = "nordbalticum_prices";

const BalanceContext = createContext(null);
export const useBalance = () => useContext(BalanceContext);

export function BalanceProvider({ children }) {
  const { wallet, authLoading, walletLoading } = useAuth();

  // hydrate from localStorage on init
  const [balances, setBalances] = useState(() => {
    try { return JSON.parse(localStorage.getItem(BALANCE_KEY)) || {}; }
    catch { return {}; }
  });
  const [prices, setPrices] = useState(() => {
    try { return JSON.parse(localStorage.getItem(PRICE_KEY)) || FALLBACK_PRICES; }
    catch { return FALLBACK_PRICES; }
  });
  const [loading, setLoading] = useState(true);

  // 1) One JsonRpcProvider per chain or testnet
  const providers = useMemo(() => {
    const m = {};
    networks.forEach(n => {
      m[n.value] = new JsonRpcProvider(n.rpcUrls[0]);
      if (n.testnet) m[n.testnet.value] = new JsonRpcProvider(n.testnet.rpcUrls[0]);
    });
    return m;
  }, []);

  // 2) CG ID string
  const cgIds = useMemo(
    () => Array.from(new Set(Object.values(TOKEN_IDS))).join(","),
    []
  );

  // 3a) fetch on-chain balances separately per key
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
          out[key] = 0; // never fallback to another key
        }
      })
    );
    setBalances(out);
    localStorage.setItem(BALANCE_KEY, JSON.stringify(out));
  }, [wallet, providers]);

  // 3b) fetch fiat prices from CG
  const fetchPrices = useCallback(async () => {
    try {
      const res = await fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=${cgIds}&vs_currencies=usd,eur`,
        { cache: "no-store" }
      );
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
    } catch {
      /* keep existing prices */
    }
  }, [cgIds]);

  // 4) fetch both in parallel
  const fetchAll = useCallback(async () => {
    setLoading(true);
    await Promise.all([fetchBalances(), fetchPrices()]);
    setLoading(false);
  }, [fetchBalances, fetchPrices]);

  // 5) initial + auth/wallet trigger
  useEffect(() => {
    if (!authLoading && !walletLoading) fetchAll();
  }, [authLoading, walletLoading, fetchAll]);

  // 6) background polling & on‐visible
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

  // 7) helpers
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

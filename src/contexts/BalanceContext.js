"use client";

import {
  createContext, useContext,
  useState, useEffect,
  useCallback, useMemo,
} from "react";
import { useAuth } from "@/contexts/AuthContext";
import { ethers } from "ethers";

import networks from "@/data/networks"; // your 26-chain list

const TOKEN_IDS = {
  eth:              "ethereum",
  matic:            "polygon-pos",      // ← correct slug!
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

  // load / save helpers
  const save = (k,v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch{} };
  const load = k => { try { const v=localStorage.getItem(k); return v?JSON.parse(v):null; } catch {return null;} };

  // build one ethers provider per network, picking the first working RPC URL
  const providers = useMemo(() => {
    const m = {};
    for (const net of networks) {
      const allUrls = [...(net.rpcUrls||[]), ...(net.testnet?.rpcUrls||[])];
      // try each url until one connects
      for (const url of allUrls) {
        try {
          const p = new ethers.JsonRpcProvider(url);
          m[ net.value ] = p;
          if (net.testnet) m[ net.testnet.value ] = p;
          break;
        } catch {}
      }
    }
    return m;
  }, []);

  // CoinGecko query
  const coingeckoIds = useMemo(
    () => Array.from(new Set(Object.values(TOKEN_IDS))).join(","),
    []
  );

  const fetchBalances = useCallback(async () => {
    const addr = wallet?.wallet?.address;
    if (!addr) return;
    const entries = await Promise.all(
      Object.entries(providers).map(async ([key, prov]) => {
        try {
          const v = await prov.getBalance(addr);
          return [key, parseFloat(ethers.formatEther(v))];
        } catch {
          return [key, balances[key] ?? 0];
        }
      })
    );
    const nb = Object.fromEntries(entries);
    setBalances(nb);
    save(BALANCE_KEY, nb);
  }, [wallet, providers, balances]);

  const fetchPrices = useCallback(async () => {
    try {
      const res = await fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=${coingeckoIds}&vs_currencies=usd,eur`,
        { cache: "no-store" }
      );
      const j = await res.json();
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
      console.error("CoinGecko error:", e);
    }
  }, [coingeckoIds]);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    await Promise.all([ fetchBalances(), fetchPrices() ]);
    setLoading(false);
  }, [fetchBalances, fetchPrices]);

  // hydrate on mount
  useEffect(() => {
    const cb = load(BALANCE_KEY), cp = load(PRICE_KEY);
    if (cb) setBalances(cb);
    if (cp) setPrices(cp);
  }, []);

  // initial & polling
  useEffect(() => {
    if (!authLoading && !walletLoading) fetchAll();
  }, [authLoading, walletLoading, fetchAll]);

  useEffect(() => {
    const iv = setInterval(fetchAll, 30_000);
    return () => clearInterval(iv);
  }, [fetchAll]);

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

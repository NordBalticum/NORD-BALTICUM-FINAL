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

// – your dynamic network list & chainId map
import { SUPPORTED_NETWORKS } from "@/contexts/NetworkContext";
// – resilient multi‐RPC provider factory
import { getProviderForChain } from "@/utils/getProviderForChain";

// token → CoinGecko ID for price lookups; extend as needed
const TOKEN_IDS = {
  eth:            "ethereum",
  matic:          "matic-network",
  bnb:            "binancecoin",
  avax:           "avalanche-2",
  optimism:       "optimism",
  arbitrum:       "arbitrum-one",
  base:           "base",
  zksync:         "zksync",
  linea:          "linea",
  scroll:         "scroll",
  mantle:         "mantle",
  celo:           "celo",
  gnosis:         "xdai",
  // testnets reuse mainnet IDs
  sepolia:        "ethereum",
  mumbai:         "matic-network",
  tbnb:           "binancecoin",
  fuji:           "avalanche-2",
  optimismgoerli: "optimism",
  arbitrumgoerli: "arbitrum-one",
  basegoerli:     "base",
  zksynctest:     "zksync",
  lineatest:      "linea",
  scrolltest:     "scroll",
  mantletest:     "mantle",
  alfajores:      "celo",
  chiado:         "xdai",
};

// fallback prices if CoinGecko fails
const FALLBACK_PRICES = Object.fromEntries(
  Object.keys(TOKEN_IDS).map(sym => [
    sym,
    { usd: 0, eur: 0 } // you can seed with realistic defaults
  ])
);

const BALANCE_KEY = "nordbalticum_balances";
const PRICE_KEY   = "nordbalticum_prices";

const BalanceContext = createContext(null);
export const useBalance = () => useContext(BalanceContext);

export function BalanceProvider({ children }) {
  const { wallet, authLoading, walletLoading } = useAuth();

  const [balances,   setBalances]   = useState({});
  const [prices,     setPrices]     = useState(FALLBACK_PRICES);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const lastBalances = useRef({});

  // Persist/load helpers
  const save = (key, data) => {
    try { localStorage.setItem(key, JSON.stringify(data)); } catch {}
  };
  const load = (key) => {
    try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : null; }
    catch { return null; }
  };

  // build one fallback‐backed provider per network
  const providers = useMemo(() => {
    const m = {};
    for (const net of SUPPORTED_NETWORKS) {
      try {
        m[net] = getProviderForChain(net);
      } catch {
        // ignore misconfigs
      }
    }
    return m;
  }, []);

  // coin-gecko query string
  const coingeckoQuery = useMemo(
    () => Array.from(new Set(Object.values(TOKEN_IDS))).join(","),
    []
  );

  // core fetcher
  const fetchBalancesAndPrices = useCallback(async () => {
    const addr = wallet?.wallet?.address;
    if (!addr) return;

    setLoading(true);
    setError(null);

    try {
      // 1) balances
      const entries = await Promise.all(
        Object.entries(providers).map(async ([net, provider]) => {
          try {
            const raw = await provider.getBalance(addr);
            return [net, parseFloat(ethers.formatEther(raw))];
          } catch {
            return [net, lastBalances.current[net] ?? 0];
          }
        })
      );
      const newB = Object.fromEntries(entries);
      setBalances(newB);
      lastBalances.current = newB;
      save(BALANCE_KEY, newB);

      // 2) prices
      let priceData = {};
      try {
        const resp = await fetch(
          `https://api.coingecko.com/api/v3/simple/price?ids=${coingeckoQuery}&vs_currencies=usd,eur`,
          { cache: "no-store" }
        );
        const json = await resp.json();
        for (const [sym, id] of Object.entries(TOKEN_IDS)) {
          priceData[sym] = {
            usd: json[id]?.usd ?? FALLBACK_PRICES[sym].usd,
            eur: json[id]?.eur ?? FALLBACK_PRICES[sym].eur,
          };
        }
      } catch {
        priceData = FALLBACK_PRICES;
      }
      setPrices(priceData);
      save(PRICE_KEY, priceData);

      setLastUpdated(new Date());
    } catch (err) {
      console.error("Balance fetch failed", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [wallet, providers, coingeckoQuery]);

  // hydrate from cache
  useEffect(() => {
    const cb = load(BALANCE_KEY);
    const cp = load(PRICE_KEY);
    if (cb) setBalances(cb);
    if (cp) setPrices(cp);
    if (cb) lastBalances.current = cb;
  }, []);

  // initial fetch once wallet is ready
  useEffect(() => {
    if (authLoading || walletLoading) return;
    fetchBalancesAndPrices();
  }, [authLoading, walletLoading, wallet, fetchBalancesAndPrices]);

  // poll every 30s
  useEffect(() => {
    if (!wallet?.wallet?.address) return;
    const iv = setInterval(fetchBalancesAndPrices, 30_000);
    return () => clearInterval(iv);
  }, [wallet, fetchBalancesAndPrices]);

  // refresh on focus/online
  useEffect(() => {
    const onVisible = debounce(() => {
      if (document.visibilityState === "visible") fetchBalancesAndPrices();
    }, 500);
    const onOnline  = debounce(fetchBalancesAndPrices, 500);

    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("online", onOnline);
    return () => {
      onVisible.cancel();
      onOnline.cancel();
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("online", onOnline);
    };
  }, [fetchBalancesAndPrices]);

  // formatting helpers
  const getUsdBalance = useCallback(
    net => {
      const b = balances[net] ?? lastBalances.current[net] ?? 0;
      const p = prices[net]?.usd ?? 0;
      return (b * p).toFixed(2);
    }, [balances, prices]
  );
  const getEurBalance = useCallback(
    net => {
      const b = balances[net] ?? lastBalances.current[net] ?? 0;
      const p = prices[net]?.eur ?? 0;
      return (b * p).toFixed(2);
    }, [balances, prices]
  );

  return (
    <BalanceContext.Provider value={{
      balances,
      prices,
      loading,
      error,
      lastUpdated,
      getUsdBalance,
      getEurBalance,
      refetch: fetchBalancesAndPrices,
    }}>
      {children}
    </BalanceContext.Provider>
  );
}

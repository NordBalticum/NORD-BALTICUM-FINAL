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

// ========================
// 🛠️ CONFIGURATION
// ========================

// RPC endpoints for each network, with fallback support
export const RPC = {
  eth: {
    urls: ["https://rpc.ankr.com/eth", "https://eth.llamarpc.com"],
    chainId: 1,
    name: "eth",
  },
  bnb: {
    urls: ["https://bsc-dataseed.binance.org/", "https://bsc.publicnode.com"],
    chainId: 56,
    name: "bnb",
  },
  tbnb: {
    urls: [
      "https://data-seed-prebsc-1-s1.binance.org:8545/",
      "https://bsc-testnet.public.blastapi.io",
    ],
    chainId: 97,
    name: "tbnb",
  },
  matic: {
    urls: ["https://polygon-bor.publicnode.com", "https://1rpc.io/matic"],
    chainId: 137,
    name: "matic",
  },
  avax: {
    urls: ["https://rpc.ankr.com/avalanche", "https://avalanche.drpc.org"],
    chainId: 43114,
    name: "avax",
  },
};

// CoinGecko token IDs for price lookup
export const TOKEN_IDS = {
  eth: "ethereum",
  bnb: "binancecoin",
  tbnb: "binancecoin",
  matic: "polygon",
  avax: "avalanche-2",
};

// Fallback prices if CoinGecko fails
const FALLBACK_PRICES = {
  eth: { eur: 2900, usd: 3100 },
  bnb: { eur: 450, usd: 480 },
  tbnb: { eur: 450, usd: 480 },
  matic: { eur: 1.5, usd: 1.6 },
  avax: { eur: 30, usd: 32 },
};

// LocalStorage keys
const BALANCE_KEY = "nordbalticum_balances";
const PRICE_KEY   = "nordbalticum_prices";

// ========================
// 📦 CONTEXT & HOOK
// ========================

const BalanceContext = createContext(null);
export const useBalance = () => useContext(BalanceContext);

// ========================
// ⚙️ PROVIDER
// ========================

export function BalanceProvider({ children }) {
  const { wallet, authLoading, walletLoading } = useAuth();

  // State
  const [balances, setBalances]   = useState({});
  const [prices, setPrices]       = useState(FALLBACK_PRICES);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  // Refs
  const intervalRef = useRef(null);
  const lastBalances = useRef({});

  // Persist/load helpers
  const saveToLocal = (key, data) => {
    try { localStorage.setItem(key, JSON.stringify(data)); } catch {}
  };
  const loadFromLocal = (key) => {
    try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : null; }
    catch { return null; }
  };

  // Memoized providers per network
  const providers = useMemo(() => {
    const map = {};
    for (const [net, cfg] of Object.entries(RPC)) {
      map[net] = new ethers.FallbackProvider(
        cfg.urls.map((url) =>
          new ethers.JsonRpcProvider(url, { chainId: cfg.chainId, name: cfg.name })
        )
      );
    }
    return map;
  }, []);

  // Precomputed CoinGecko ID string
  const coingeckoIds = useMemo(
    () => Array.from(new Set(Object.values(TOKEN_IDS))).join(","),
    []
  );

  // Fetch balances & prices
  const fetchBalancesAndPrices = useCallback(async () => {
    if (!wallet?.wallet?.address) return;

    setLoading(true);
    setError(null);

    try {
      const address = wallet.wallet.address;

      // 1) Balances: parallel over networks
      const balanceEntries = await Promise.all(
        Object.entries(providers).map(async ([net, provider]) => {
          try {
            const raw = await provider.getBalance(address);
            return [net, parseFloat(ethers.formatEther(raw))];
          } catch (err) {
            console.warn(`Failed balance ${net}:`, err.message);
            return [net, lastBalances.current[net] || 0];
          }
        })
      );
      const newBalances = Object.fromEntries(balanceEntries);
      setBalances(newBalances);
      saveToLocal(BALANCE_KEY, newBalances);
      lastBalances.current = newBalances;

      // 2) Prices via CoinGecko
      let priceData = {};
      try {
        const res = await fetch(
          `https://api.coingecko.com/api/v3/simple/price?ids=${coingeckoIds}&vs_currencies=eur,usd`,
          { cache: "no-store" }
        );
        if (!res.ok) throw new Error("Coingecko response not ok");
        const json = await res.json();
        for (const [sym, id] of Object.entries(TOKEN_IDS)) {
          priceData[sym] = {
            eur: json[id]?.eur ?? FALLBACK_PRICES[sym].eur,
            usd: json[id]?.usd ?? FALLBACK_PRICES[sym].usd,
          };
        }
      } catch (err) {
        console.warn("Price fetch failed:", err.message);
        priceData = FALLBACK_PRICES;
      }
      setPrices(priceData);
      saveToLocal(PRICE_KEY, priceData);

      setLastUpdated(new Date());
    } catch (err) {
      console.error("fetchBalancesAndPrices error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [wallet, providers, coingeckoIds]);

  // Initial load from cache
  useEffect(() => {
    const cachedBalances = loadFromLocal(BALANCE_KEY);
    const cachedPrices   = loadFromLocal(PRICE_KEY);
    if (cachedBalances) setBalances(cachedBalances);
    if (cachedPrices)   setPrices(cachedPrices);
    lastBalances.current = cachedBalances || {};
  }, []);

  // Fetch once wallet is ready
  useEffect(() => {
    if (authLoading || walletLoading || !wallet?.wallet?.address) return;
    fetchBalancesAndPrices();
  }, [authLoading, walletLoading, wallet, fetchBalancesAndPrices]);

  // Poll every 30s
  useEffect(() => {
    if (!wallet?.wallet?.address) return;
    intervalRef.current = setInterval(fetchBalancesAndPrices, 30_000);
    return () => clearInterval(intervalRef.current);
  }, [wallet, fetchBalancesAndPrices]);

  // Refresh on tab visibility or network reconnect
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

  // Helper: format converted balances
  const getUsdBalance = useCallback(
    (net) => {
      const bal = balances[net] ?? lastBalances.current[net] ?? 0;
      const price = prices[net]?.usd ?? FALLBACK_PRICES[net].usd;
      return (bal * price).toFixed(2);
    },
    [balances, prices]
  );
  const getEurBalance = useCallback(
    (net) => {
      const bal = balances[net] ?? lastBalances.current[net] ?? 0;
      const price = prices[net]?.eur ?? FALLBACK_PRICES[net].eur;
      return (bal * price).toFixed(2);
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
        lastUpdated,
        getUsdBalance,
        getEurBalance,
        refetch: fetchBalancesAndPrices,
      }}
    >
      {children}
    </BalanceContext.Provider>
  );
}

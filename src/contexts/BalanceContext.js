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

import networks from "@/data/networks"; // mūsų bendras network sąrašas
import { getProviderForChain } from "@/utils/getProviderForChain";

// token → CoinGecko ID for price lookup
const TOKEN_IDS = {
  eth:            "ethereum",
  polygon:        "polygon-pos",
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
  // Testnets map to their mainnet ID
  sepolia:        "ethereum",
  mumbai:         "polygon-pos",
  bnbt:           "binancecoin",
  fuji:           "avalanche-2",
  "optimism-goerli": "optimism",
  "arbitrum-goerli": "arbitrum-one",
  "base-goerli": "base",
  "zksync-testnet": "zksync",
  "linea-testnet": "linea",
  "scroll-testnet": "scroll",
  "mantle-testnet": "mantle",
  alfajores:      "celo",
  chiado:         "xdai",
};

const FALLBACK_PRICES = Object.fromEntries(
  Object.keys(TOKEN_IDS).map(sym => [sym, { usd: 0, eur: 0 }])
);

const BALANCE_KEY = "nordbalticum_balances";
const PRICE_KEY   = "nordbalticum_prices";

const BalanceContext = createContext(null);
export const useBalance = () => useContext(BalanceContext);

export function BalanceProvider({ children }) {
  const { wallet, authLoading, walletLoading } = useAuth();

  const [balances, setBalances] = useState({});
  const [prices, setPrices] = useState(FALLBACK_PRICES);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const lastBalances = useRef({});

  const save = (key, data) => {
    try { localStorage.setItem(key, JSON.stringify(data)); } catch {}
  };
  const load = (key) => {
    try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : null; }
    catch { return null; }
  };

  // Dynamic providers build
  const providers = useMemo(() => {
    const m = {};
    for (const net of networks) {
      try {
        m[net.value] = getProviderForChain(net.chainId);
        if (net.testnet) {
          m[net.testnet.value] = getProviderForChain(net.testnet.chainId);
        }
      } catch (err) {
        console.error(`⚠️ Error building provider for ${net.label}:`, err);
      }
    }
    return m;
  }, []);

  const coingeckoQuery = useMemo(
    () => Array.from(new Set(Object.values(TOKEN_IDS))).join(","),
    []
  );

  const fetchBalancesAndPrices = useCallback(async () => {
    const addr = wallet?.wallet?.address;
    if (!addr) return;

    setLoading(true);
    setError(null);

    try {
      // 1) Balances
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

      // 2) Prices
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

  useEffect(() => {
    const cb = load(BALANCE_KEY);
    const cp = load(PRICE_KEY);
    if (cb) setBalances(cb);
    if (cp) setPrices(cp);
    if (cb) lastBalances.current = cb;
  }, []);

  useEffect(() => {
    if (authLoading || walletLoading) return;
    fetchBalancesAndPrices();
  }, [authLoading, walletLoading, wallet, fetchBalancesAndPrices]);

  useEffect(() => {
    if (!wallet?.wallet?.address) return;
    const iv = setInterval(fetchBalancesAndPrices, 30_000);
    return () => clearInterval(iv);
  }, [wallet, fetchBalancesAndPrices]);

  useEffect(() => {
    const onVisible = debounce(() => {
      if (document.visibilityState === "visible") fetchBalancesAndPrices();
    }, 500);
    const onOnline = debounce(fetchBalancesAndPrices, 500);

    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("online", onOnline);
    return () => {
      onVisible.cancel();
      onOnline.cancel();
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("online", onOnline);
    };
  }, [fetchBalancesAndPrices]);

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

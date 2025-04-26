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

// ── CoinGecko IDs (must match your networks[].value) ───────────────────────
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
  // Testnets map to mainnet token IDs:
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

// fallback if CG fails
const FALLBACK_PRICES = Object.fromEntries(
  Object.keys(TOKEN_IDS).map(sym => [sym, { usd: 0, eur: 0 }])
);

const BALANCE_KEY = "nordbalticum_balances";
const PRICE_KEY   = "nordbalticum_prices";

// allow pro‐tier key usage
const CG_KEY = process.env.NEXT_PUBLIC_COINGECKO_KEY;

const BalanceContext = createContext(null);
export const useBalance = () => useContext(BalanceContext);

export function BalanceProvider({ children }) {
  const { wallet, authLoading, walletLoading } = useAuth();

  const [balances,   setBalances]   = useState({});
  const [prices,     setPrices]     = useState(FALLBACK_PRICES);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState(null);
  const [lastUpdated,setLastUpdated]= useState(null);

  const lastBalances = useRef({});

  // simple localStorage caching
  const save = (k, v) => { try { localStorage.setItem(k,JSON.stringify(v)); } catch{} };
  const load = k => { try{ const v=localStorage.getItem(k); return v?JSON.parse(v):null;}catch{return null;} };

  // build one provider per network value
  const providers = useMemo(() => {
    const m = {};
    for (const net of networks) {
      try {
        m[net.value] = getProviderForChain(net.chainId);
        if (net.testnet) {
          m[net.testnet.value] = getProviderForChain(net.testnet.chainId);
        }
      } catch (e) {
        console.warn(`⚠️ Provider for ${net.value} failed:`, e);
      }
    }
    return m;
  }, []);

  // comma‐list of unique CoinGecko IDs
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
      // ── 1) fetch on‐chain balances ─────────────────────────────
      const balanceEntries = await Promise.all(
        Object.entries(providers).map(async ([net, prov]) => {
          try {
            const raw = await prov.getBalance(addr);
            return [net, parseFloat(ethers.formatEther(raw))];
          } catch {
            return [net, lastBalances.current[net] ?? 0];
          }
        })
      );
      const newBalances = Object.fromEntries(balanceEntries);
      setBalances(newBalances);
      lastBalances.current = newBalances;
      save(BALANCE_KEY, newBalances);

      // ── 2) fetch prices via CoinGecko ─────────────────────────
      let priceData = {};
      try {
        const url = `https://api.coingecko.com/api/v3/simple/price` +
                    `?ids=${coingeckoQuery}&vs_currencies=usd,eur`;
        const resp = await fetch(url, {
          cache: "no-store",
          headers: CG_KEY ? { "x_cg_pro_api_key": CG_KEY } : {},
        });
        const json = await resp.json();
        for (const [sym, id] of Object.entries(TOKEN_IDS)) {
          priceData[sym] = {
            usd: json[id]?.usd ?? FALLBACK_PRICES[sym].usd,
            eur: json[id]?.eur ?? FALLBACK_PRICES[sym].eur,
          };
        }
      } catch (e) {
        console.error("❌ CoinGecko fetch failed:", e);
        priceData = FALLBACK_PRICES;
      }
      setPrices(priceData);
      save(PRICE_KEY, priceData);

      setLastUpdated(new Date());
    } catch (e) {
      console.error("Balance fetch failed", e);
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [wallet, providers, coingeckoQuery]);

  // hydrate from cache
  useEffect(() => {
    const cb = load(BALANCE_KEY), cp = load(PRICE_KEY);
    if (cb) { setBalances(cb); lastBalances.current = cb; }
    if (cp) setPrices(cp);
  }, []);

  // initial fetch once wallet ready
  useEffect(() => {
    if (authLoading || walletLoading) return;
    fetchBalancesAndPrices();
  }, [authLoading, walletLoading, wallet, fetchBalancesAndPrices]);

  // poll every 30s
  useEffect(() => {
    if (!wallet?.wallet?.address) return;
    const id = setInterval(fetchBalancesAndPrices, 30_000);
    return () => clearInterval(id);
  }, [wallet, fetchBalancesAndPrices]);

  // refresh on focus/online
  useEffect(() => {
    const onVis = debounce(() => {
      if (document.visibilityState==="visible") fetchBalancesAndPrices();
    }, 500);
    const onOnl = debounce(fetchBalancesAndPrices, 500);
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("online", onOnl);
    return () => {
      onVis.cancel(); onOnl.cancel();
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("online", onOnl);
    };
  }, [fetchBalancesAndPrices]);

  // helpers
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

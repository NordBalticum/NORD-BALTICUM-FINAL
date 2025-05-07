// src/contexts/BalanceContext.js
"use client";

// ==========================================
// 💎 BALANCE CONTEXT – META-GRADE FINAL v2.5
// ==========================================

import React, {
  createContext, useContext, useState, useEffect,
  useCallback, useMemo, useRef
} from "react";

import { ethers, JsonRpcProvider, FallbackProvider } from "ethers";
import debounce from "lodash.debounce";

import { useAuth } from "@/contexts/AuthContext";
import networks from "@/data/networks";

// ==========================================
// 🧠 Konteksto kūrimas
// ==========================================
const BalanceContext = createContext(null);
export const useBalance = () => useContext(BalanceContext);

// ==========================================
// ⏱️ Konstantos ir helperiai
// ==========================================
const PRICE_TTL = 30000;

const format = (v, d = 5) =>
  typeof v !== "number" || isNaN(v) ? "0.00000" : Number(v).toFixed(d);

// ==========================================
// 🎯 Token ID mapping iš networks.js
// ==========================================
const COINGECKO_IDS = {
  eth: "ethereum", sepolia: "ethereum", matic: "polygon", mumbai: "polygon",
  bnb: "binancecoin", tbnb: "binancecoin", avax: "avalanche-2", fuji: "avalanche-2",
  optimism: "optimism", "optimism-goerli": "optimism", arbitrum: "arbitrum", "arbitrum-goerli": "arbitrum",
  base: "base", "base-goerli": "base", scroll: "scroll", linea: "linea", zksync: "zksync",
  mantle: "mantle", "mantle-testnet": "mantle", celo: "celo", moonbeam: "moonbeam", aurora: "aurora-near",
  fantom: "fantom", "fantom-testnet": "fantom", gnosis: "xdai", core: "coredao-org", dogechain: "dogechain",
  zkfair: "zkfair", flare: "flare-networks", kava: "kava", metis: "metis-token", okx: "okb",
  cronos: "cronos", brise: "bitrise-token", boba: "boba-network", astar: "astar", velas: "velas",
  fuse: "fuse-network-token", canto: "canto", evmos: "evmos", rsk: "rootstock", telos: "telos",
  rei: "rei-network", shardeum: "shardeum", tenet: "tenet", klaytn: "klay-token", btt: "bittorrent",
  palm: "palm", metachain: "metachain", energyweb: "energy-web-token", cortex: "cortex",
  harmony: "harmony", callisto: "callisto-network", okc: "okex-chain", theta: "theta-token",
  wan: "wanchain", findora: "findora", ubiq: "ubiq", meter: "meter", oasis: "oasis-network",
  kardia: "kardiachain", tomo: "tomochain", elysium: "elysium", energi: "energi", luxy: "luxy",
  exosama: "exosama", sapphire: "oasis-network", clover: "clover-finance", fusion: "fusion", dfk: "defi-kingdoms",
  "theta-testnet": "theta-token"
};

const COINCAP_IDS = {
  eth: "ethereum", sepolia: "ethereum", matic: "polygon", mumbai: "polygon",
  bnb: "binance-coin", tbnb: "binance-coin", avax: "avalanche", fuji: "avalanche",
  optimism: "optimism", "optimism-goerli": "optimism", arbitrum: "arbitrum", "arbitrum-goerli": "arbitrum",
  base: "base", "base-goerli": "base", scroll: "scroll", linea: "linea", zksync: "zksync",
  mantle: "mantle", "mantle-testnet": "mantle", celo: "celo", moonbeam: "moonbeam", aurora: "aurora",
  fantom: "fantom", "fantom-testnet": "fantom", gnosis: "xdai", core: "coredao", dogechain: "dogechain",
  zkfair: "zkfair", flare: "flare", kava: "kava", metis: "metis-token", okx: "okb",
  cronos: "cronos", brise: "bitrise-token", boba: "boba-token", astar: "astar", velas: "velas",
  fuse: "fuse", canto: "canto", evmos: "evmos", rsk: "rootstock", telos: "telos",
  rei: "rei-network", shardeum: "shardeum", tenet: "tenet", klaytn: "klay-token", btt: "bittorrent",
  palm: "palm", metachain: "metachain", energyweb: "energy-web-token", cortex: "cortex",
  harmony: "harmony", callisto: "callisto-network", okc: "okex-chain", theta: "theta",
  wan: "wanchain", findora: "findora", ubiq: "ubiq", meter: "meter", oasis: "oasis-network",
  kardia: "kardiachain", tomo: "tomochain", elysium: "elysium", energi: "energi", luxy: "luxy",
  exosama: "exosama", sapphire: "oasis-network", clover: "clover-finance", fusion: "fusion", dfk: "defi-kingdoms",
  "theta-testnet": "theta"
};

const FALLBACK_PRICES = Object.fromEntries(
  Object.keys(COINGECKO_IDS).map(key => [key, { usd: 0, eur: 0 }])
);

// ==========================================
// 🚀 BalanceProvider komponentas
// ==========================================
export function BalanceProvider({ children }) {
  const { wallet, authLoading, walletLoading } = useAuth();

  const [balances, setBalances] = useState({});
  const [prices, setPrices] = useState(FALLBACK_PRICES);
  const [loading, setLoading] = useState(true);
  const [balancesReady, setBalancesReady] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  const lastPriceFetch = useRef(0);
  const silentLoading = useRef(false);
  const retryQueue = useRef([]);
  const retryCount = useRef(0);

  // ==========================================
  // 🌐 Sugeneruojame visų tinklų FallbackProviders iš networks.js
  // ==========================================
  const providers = useMemo(() => {
    const map = {};
    networks.forEach(({ value, rpcUrls }) => {
      if (value && Array.isArray(rpcUrls) && rpcUrls.length > 0) {
        try {
          map[value] = new FallbackProvider(
            rpcUrls.map(url => new JsonRpcProvider(url))
          );
        } catch (err) {
          console.warn(`[Balance] ❌ Provider error for ${value}:`, err);
        }
      }
    });
    return map;
  }, []);

// ==========================================
  // 💸 ETH balansų užklausa per visus tinklus
  // ==========================================
  const fetchBalances = useCallback(async () => {
    const address = wallet?.wallet?.address;
    if (!address) return {};
    const results = {};
    await Promise.allSettled(
      Object.entries(providers).map(async ([key, provider]) => {
        try {
          const bal = await provider.getBalance(address, "latest");
          results[key] = parseFloat(ethers.formatEther(bal));
        } catch (err) {
          console.warn(`[Balance] ❌ Balance fetch fail on ${key}:`, err?.message);
          results[key] = 0;
        }
      })
    );
    return results;
  }, [wallet, providers]);

  // ==========================================
  // 📈 Kainų užklausa iš CoinGecko + CoinCap fallback
  // ==========================================
  const fetchPrices = useCallback(async () => {
    const now = Date.now();
    if (now - lastPriceFetch.current < PRICE_TTL) return prices;

    try {
      const res = await fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=${Object.values(COINGECKO_IDS).join(",")}&vs_currencies=usd,eur`,
        { cache: "no-store" }
      );
      const data = await res.json();
      const out = {};
      for (const [key, id] of Object.entries(COINGECKO_IDS)) {
        out[key] = {
          usd: data[id]?.usd ?? 0,
          eur: data[id]?.eur ?? 0,
        };
      }
      lastPriceFetch.current = now;
      return out;
    } catch (err) {
      console.warn("[Balance] ❌ CoinGecko error, falling back to CoinCap:", err?.message);
      try {
        const res = await fetch("https://api.coincap.io/v2/assets", {
          headers: { accept: "application/json" },
        });
        const { data } = await res.json();
        const lookup = Object.fromEntries(data.map(item => [item.id, Number(item.priceUsd) || 0]));
        const out = {};
        for (const [key, id] of Object.entries(COINCAP_IDS)) {
          out[key] = {
            usd: lookup[id] ?? 0,
            eur: 0,
          };
        }
        lastPriceFetch.current = now;
        return out;
      } catch (err2) {
        console.error("[Balance] ❌ CoinCap fallback failed:", err2?.message);
        return prices;
      }
    }
  }, [prices]);

  // ==========================================
  // 🔁 fetchAll + retry su exponential backoff
  // ==========================================
  const fetchAll = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    silentLoading.current = true;
    try {
      const [newBalances, newPrices] = await Promise.all([
        fetchBalances(),
        fetchPrices(),
      ]);
      setBalances(newBalances);
      setPrices(newPrices);
      setLastUpdated(Date.now());
      retryCount.current = 0;
      retryQueue.current.forEach(clearTimeout);
      retryQueue.current = [];
    } catch (err) {
      console.error("[Balance] ❌ fetchAll error:", err?.message);
      silentRetry();
    } finally {
      if (!silent) setLoading(false);
      setBalancesReady(true);
      silentLoading.current = false;
    }
  }, [fetchBalances, fetchPrices]);

  const silentRetry = useCallback(() => {
    if (retryCount.current >= 6) return;
    const delay = Math.min(2 ** retryCount.current * 3000, 60000);
    const id = setTimeout(() => fetchAll(true), delay);
    retryQueue.current.push(id);
    retryCount.current++;
    console.warn(`[Balance] 🔁 Retry #${retryCount.current} in ${delay / 1000}s`);
  }, [fetchAll]);

// ==========================================
  // ⏱️ Automatinis balansų atnaujinimas
  // ==========================================
  useEffect(() => {
    if (!authLoading && !walletLoading && wallet?.wallet?.address) {
      fetchAll();
    }
  }, [authLoading, walletLoading, wallet, fetchAll]);

  // 🔁 Periodinis fetch kas 30s + matomumo detektorius
  useEffect(() => {
    const interval = setInterval(() => {
      if (!silentLoading.current) fetchAll(true);
    }, 30000);

    const onVisible = debounce(() => {
      if (document.visibilityState === "visible" && !silentLoading.current) {
        fetchAll(true);
      }
    }, 300);

    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(interval);
      retryQueue.current.forEach(clearTimeout);
      retryQueue.current = [];
      onVisible.cancel();
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [fetchAll]);

  // ==========================================
  // 💲 Balanso skaičiavimo helperiai
  // ==========================================
  const getUsdBalance = (key) =>
    format((balances[key] || 0) * (prices[key]?.usd || 0), 2);

  const getEurBalance = (key) =>
    format((balances[key] || 0) * (prices[key]?.eur || 0), 2);

  const getFormattedBalance = (key) =>
    format(balances[key] || 0);

  // ==========================================
  // ✅ BalanceContext eksportas
  // ==========================================
  return (
    <BalanceContext.Provider
      value={{
        balances,
        prices,
        loading,
        balancesReady,
        lastUpdated,
        getUsdBalance,
        getEurBalance,
        getFormattedBalance,
        refetch: () => fetchAll(true),
      }}
    >
      {children}
    </BalanceContext.Provider>
  );
}

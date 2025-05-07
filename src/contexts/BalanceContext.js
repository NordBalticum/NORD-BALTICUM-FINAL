"use client";

// ==========================================
// 💎 BALANCE CONTEXT – META DIAMOND v4.0
// ==========================================

import React, {
  createContext, useContext, useState, useEffect,
  useCallback, useMemo, useRef
} from "react";

import { ethers, JsonRpcProvider, FallbackProvider } from "ethers";
import debounce from "lodash.debounce";
import throttle from "lodash.throttle"; // Performance

import { useAuth } from "@/contexts/AuthContext";
import networks from "@/data/networks";

// ==========================================
// 🧠 Context setup
// ==========================================
const BalanceContext = createContext(null);
export const useBalance = () => useContext(BalanceContext);

// ==========================================
// ⏱️ Constants + helpers
// ==========================================
const PRICE_TTL = 30000;
const MAX_RETRIES = 6;

const format = (v, d = 5) =>
  typeof v !== "number" || isNaN(v) ? "0.00000" : Number(v).toFixed(d);

// ==========================================
// 🎯 Static token ID mapping
// ==========================================
import { ERC20_ABI } from "@/utils/erc20ABI"; // <- turi būti saugiai importuota

const COINGECKO_IDS = {
  eth: "ethereum", matic: "polygon", bnb: "binancecoin", avax: "avalanche-2",
  optimism: "optimism", arbitrum: "arbitrum", base: "base", celo: "celo",
  moonbeam: "moonbeam", aurora: "aurora-near", fantom: "fantom", gnosis: "xdai",
  core: "coredao-org", dogechain: "dogechain", zksync: "zksync", linea: "linea",
  zkfair: "zkfair", flare: "flare-networks", kava: "kava", metis: "metis-token",
  okx: "okb", cronos: "cronos", brise: "bitrise-token", boba: "boba-network",
  astar: "astar", velas: "velas", fuse: "fuse-network-token", canto: "canto",
  evmos: "evmos", telos: "telos", klaytn: "klay-token", theta: "theta-token",
  oasis: "oasis-network", energi: "energi"
};

const COINCAP_IDS = {
  eth: "ethereum", matic: "polygon", bnb: "binance-coin", avax: "avalanche",
  optimism: "optimism", arbitrum: "arbitrum", base: "base", celo: "celo",
  moonbeam: "moonbeam", aurora: "aurora", fantom: "fantom", gnosis: "xdai",
  core: "coredao", dogechain: "dogechain", zksync: "zksync", linea: "linea",
  zkfair: "zkfair", flare: "flare", kava: "kava", metis: "metis-token",
  okx: "okb", cronos: "cronos", brise: "bitrise-token", boba: "boba-token",
  astar: "astar", velas: "velas", fuse: "fuse", canto: "canto",
  evmos: "evmos", telos: "telos", klaytn: "klay-token", theta: "theta",
  oasis: "oasis-network", energi: "energi"
};

const FALLBACK_PRICES = Object.fromEntries(
  Object.keys(COINGECKO_IDS).map(k => [k, { usd: 0, eur: 0 }])
);

// ==========================================
// 🌐 FallbackProviders iš networks.js
// ==========================================
const providers = useMemo(() => {
  const out = {};
  networks.forEach(({ value, rpcUrls }) => {
    if (value && Array.isArray(rpcUrls) && rpcUrls.length > 0) {
      try {
        out[value] = new FallbackProvider(
          rpcUrls.map(url => new JsonRpcProvider(url))
        );
      } catch (err) {
        console.warn(`[Balance] ❌ Provider error for ${value}:`, err);
      }
    }
  });
  return out;
}, []);

// ==========================================
// 💸 ETH balansai per visus tinklus
// ==========================================
const fetchNativeBalances = useCallback(async () => {
  const address = wallet?.wallet?.address;
  if (!address) return {};
  const result = {};

  await Promise.allSettled(
    Object.entries(providers).map(async ([key, provider]) => {
      try {
        const bal = await provider.getBalance(address, "latest");
        result[key] = parseFloat(ethers.formatEther(bal));
      } catch (err) {
        console.warn(`[Balance] ❌ Native balance fail on ${key}:`, err?.message);
        result[key] = 0;
      }
    })
  );

  return result;
}, [wallet, providers]);

// ==========================================
// 📈 CoinGecko + CoinCap fallback kainos
// ==========================================
const fetchPrices = useCallback(async () => {
  const now = Date.now();
  if (now - lastPriceFetch.current < PRICE_TTL) return prices;

  try {
    const ids = [...new Set(Object.values(COINGECKO_IDS))].join(",");
    const res = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd,eur`,
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
    console.warn("[Balance] ❌ CoinGecko error:", err?.message);
    try {
      const res = await fetch("https://api.coincap.io/v2/assets", {
        headers: { accept: "application/json" },
      });
      const { data } = await res.json();
      const lookup = Object.fromEntries(data.map(i => [i.id, Number(i.priceUsd) || 0]));
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
      console.error("[Balance] ❌ CoinCap fallback error:", err2?.message);
      return prices;
    }
  }
}, [prices]);

// ==========================================
// 🧠 ERC20 ABI – balansui tikrinti
// ==========================================
const ERC20_ABI = [
  "function balanceOf(address account) view returns (uint)",
  "function decimals() view returns (uint8)"
];

// ==========================================
// 💰 ERC20 balansai iš networks.js
// ==========================================
const fetchERC20Balances = useCallback(async () => {
  const address = wallet?.wallet?.address;
  if (!address) return {};

  const result = {};
  await Promise.allSettled(
    networks.map(async ({ value, erc20Address }) => {
      if (!value || !erc20Address || !ethers.isAddress(erc20Address)) return;

      const provider = providers[value];
      if (!provider) return;

      try {
        const contract = new ethers.Contract(erc20Address, ERC20_ABI, provider);
        const [decimals, raw] = await Promise.all([
          contract.decimals(),
          contract.balanceOf(address),
        ]);
        result[value + "_erc20"] = parseFloat(ethers.formatUnits(raw, decimals));
      } catch (err) {
        console.warn(`[Balance] ❌ ERC20 balance fail on ${value}:`, err?.message);
        result[value + "_erc20"] = 0;
      }
    })
  );

  return result;
}, [wallet, providers]);

// ==========================================
// 🔁 fetchAll – krauna viską: native, erc20, prices
// ==========================================
const fetchAll = useCallback(async (silent = false) => {
  if (!silent) setLoading(true);
  silentLoading.current = true;

  try {
    const [native, erc20, fetchedPrices] = await Promise.all([
      fetchNativeBalances(),
      fetchERC20Balances(),
      fetchPrices(),
    ]);
    setBalances({ ...native, ...erc20 });
    setPrices(fetchedPrices);
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
}, [fetchNativeBalances, fetchERC20Balances, fetchPrices]);

// ==========================================
// 🔁 Silent Retry – exponential backoff
// ==========================================
const silentRetry = useCallback(() => {
  if (retryCount.current >= MAX_RETRIES) return;
  const delay = Math.min(2 ** retryCount.current * 3000, 60000);
  const id = setTimeout(() => fetchAll(true), delay);
  retryQueue.current.push(id);
  retryCount.current++;
  console.warn(`[Balance] 🔁 Retry #${retryCount.current} in ${delay / 1000}s`);
}, [fetchAll]);

// ==========================================
// ⏱️ Automatinis balansų užkrovimas on boot
// ==========================================
useEffect(() => {
  if (!authLoading && !walletLoading && wallet?.wallet?.address) {
    fetchAll();
  }
}, [authLoading, walletLoading, wallet, fetchAll]);

// ==========================================
// ⏲️ Periodinis fetch kas 30s + tab visibility triggeris
// ==========================================
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
// 💲 Helperiai balansui: native ir ERC20
// ==========================================
const getUsdBalance = useCallback((key) => {
  const price = prices[key]?.usd ?? 0;
  const amount = balances[key] ?? 0;
  return format(amount * price, 2);
}, [balances, prices]);

const getEurBalance = useCallback((key) => {
  const price = prices[key]?.eur ?? 0;
  const amount = balances[key] ?? 0;
  return format(amount * price, 2);
}, [balances, prices]);

const getFormattedBalance = useCallback((key) => {
  return format(balances[key] ?? 0);
}, [balances]);

const getTokenBalance = useCallback((key) => {
  return balances[key + "_erc20"] ?? 0;
}, [balances]);

const getFormattedTokenBalance = useCallback((key) => {
  return format(balances[key + "_erc20"] ?? 0);
}, [balances]);

const getUsdTokenBalance = useCallback((key) => {
  const price = prices[key]?.usd ?? 0;
  const amount = balances[key + "_erc20"] ?? 0;
  return format(amount * price, 2);
}, [balances, prices]);

const getEurTokenBalance = useCallback((key) => {
  const price = prices[key]?.eur ?? 0;
  const amount = balances[key + "_erc20"] ?? 0;
  return format(amount * price, 2);
}, [balances, prices]);

// ==========================================
// ✅ Context Returnas – viskas kas reikia appsui
// ==========================================
return (
  <BalanceContext.Provider
    value={{
      balances,
      prices,
      loading,
      balancesReady,
      lastUpdated,
      refetch: () => fetchAll(true),
      getUsdBalance,
      getEurBalance,
      getFormattedBalance,
      getTokenBalance,
      getFormattedTokenBalance,
      getUsdTokenBalance,
      getEurTokenBalance,
    }}
  >
    {children}
  </BalanceContext.Provider>
);

// ==========================================
// 🛡️ SSR-safe useBalance hook
// ==========================================
export const useBalance = () => {
  const context = useContext(BalanceContext);
  if (!context) {
    if (typeof window !== "undefined") {
      throw new Error("❌ useBalance turi būti naudojamas su <BalanceProvider>");
    }
    return {
      balances: {},
      prices: {},
      loading: true,
      balancesReady: false,
      lastUpdated: null,
      refetch: () => {},
      getUsdBalance: () => "0.00",
      getEurBalance: () => "0.00",
      getFormattedBalance: () => "0.00000",
      getTokenBalance: () => 0,
      getFormattedTokenBalance: () => "0.00000",
      getUsdTokenBalance: () => "0.00",
      getEurTokenBalance: () => "0.00",
    };
  }
  return context;
};

// ==========================================
// ✅ Eksportas
// ==========================================
export { BalanceProvider };

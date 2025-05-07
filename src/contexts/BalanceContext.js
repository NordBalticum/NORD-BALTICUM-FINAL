// src/contexts/BalanceContext.js
"use client";

// ==========================================
// 💎 BALANCE CONTEXT – FINAL META-GRADE v1
// ==========================================

import React, {
  createContext, useContext, useState, useEffect,
  useCallback, useMemo, useRef
} from "react";

import { ethers, JsonRpcProvider, FallbackProvider } from "ethers";
import debounce from "lodash.debounce";

import { useAuth } from "@/contexts/AuthContext";
import fallbackRPCs from "@/utils/fallbackRPCs";

// ==========================================
// 🌐 Pagrindiniai parametrai
// ==========================================
const DEFAULT_NETWORKS = [
  "eth", "bnb", "matic", "avax",
  "sepolia", "tbnb", "mumbai", "fuji"
];

// 🎯 Token ID priskyrimas kainoms gauti
const TOKEN_IDS = Object.fromEntries(
  Object.entries(fallbackRPCs).map(([key, { label }]) => {
    const name = label.toLowerCase();
    const id =
      name.includes("eth") ? "ethereum" :
      name.includes("matic") ? "polygon" :
      name.includes("bnb") ? "binancecoin" :
      name.includes("avax") ? "avalanche-2" :
      name.includes("optimism") ? "optimism" :
      name.includes("arbitrum") ? "arbitrum" :
      name.includes("base") ? "base" :
      name.includes("zksync") ? "zksync" :
      name.includes("scroll") ? "scroll" :
      name.includes("linea") ? "linea" :
      name.includes("mantle") ? "mantle" :
      name.includes("celo") ? "celo" :
      name.includes("moonbeam") ? "moonbeam" :
      name.includes("aurora") ? "aurora" :
      "ethereum"; // fallback
    return [key, id];
  })
);

// 💰 Tušti fallback'ai kainoms
const FALLBACK_PRICES = Object.fromEntries(
  Object.keys(TOKEN_IDS).map(key => [key, { usd: 0, eur: 0 }])
);

// ⏱️ Kainų cache laikas
const PRICE_TTL = 30_000;

// 💱 Pagalbinė funkcija skaičiams formatuoti
const format = (v, d = 5) => (typeof v !== "number" || isNaN(v)) ? "0.00000" : Number(v).toFixed(d);

// 📌 Tik galiojantys tinklai pagal fallbackRPCs
function getValidNetworks(localEnabled) {
  return [...new Set([...DEFAULT_NETWORKS, ...(Array.isArray(localEnabled) ? localEnabled : [])])]
    .filter(key => fallbackRPCs[key]);
}

// 📦 Sukuriame kontekstą
const BalanceContext = createContext(null);
export const useBalance = () => useContext(BalanceContext);

// ==========================================
// 🚀 Pagrindinis komponentas: BalanceProvider
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

  // 🧠 LocalStorage tinklų parinkimas
  const enabledNetworks = useMemo(() => {
    try {
      const stored = JSON.parse(localStorage.getItem("enabledNetworks"));
      return getValidNetworks(stored);
    } catch {
      return DEFAULT_NETWORKS;
    }
  }, []);

  // 🌐 Kiekvienam tinklui sugeneruojame FallbackProvider su keliais RPC
  const providers = useMemo(() => {
    const result = {};
    for (const key of enabledNetworks) {
      const net = fallbackRPCs[key];
      if (net?.rpcs?.length) {
        try {
          result[key] = new FallbackProvider(
            net.rpcs.map(url => new JsonRpcProvider(url))
          );
        } catch (err) {
          console.warn(`[Balance] ❌ Provider setup error for ${key}:`, err);
        }
      }
    }
    return result;
  }, [enabledNetworks]);

  // 📊 CoinGecko tokenų ID sąrašas
  const coingeckoIds = useMemo(() => {
    return [...new Set(Object.values(TOKEN_IDS))].join(",");
  }, []);

  // ==========================================
  // 💸 Balansų užklausa per fallback providerius
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
          console.warn(`[Balance] ❌ Failed on ${key}:`, err?.message);
          results[key] = 0;
        }
      })
    );
    return results;
  }, [wallet, providers]);

  // ==========================================
  // 📈 Kainų užklausa per CoinGecko ir fallback į CoinCap
  // ==========================================
  const fetchPrices = useCallback(async () => {
    const now = Date.now();
    if (now - lastPriceFetch.current < PRICE_TTL) return prices;

    try {
      const res = await fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=${coingeckoIds}&vs_currencies=usd,eur`,
        { cache: "no-store" }
      );
      const data = await res.json();
      const out = {};
      for (const [sym, id] of Object.entries(TOKEN_IDS)) {
        out[sym] = {
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
        const lookup = Object.fromEntries(
          data.map(item => [item.id, Number(item.priceUsd) || 0])
        );
        const out = {};
        for (const [sym, id] of Object.entries(TOKEN_IDS)) {
          out[sym] = {
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
  }, [coingeckoIds, prices]);

  // ==========================================
  // 🔁 Pagrindinė duomenų užklausos funkcija su retry valdymu
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

  // 🔁 Retry mechanizmas su exponential backoff
  const silentRetry = useCallback(() => {
    if (retryCount.current >= 6) return;
    const delay = Math.min(2 ** retryCount.current * 3000, 60000);
    const id = setTimeout(() => fetchAll(true), delay);
    retryQueue.current.push(id);
    retryCount.current++;
    console.warn(`[Balance] 🔁 Retry #${retryCount.current} in ${delay / 1000}s`);
  }, [fetchAll]);

  // ==========================================
  // 🎯 Automatinis fetch kai wallet pasiruošęs
  // ==========================================
  useEffect(() => {
    if (!authLoading && !walletLoading && wallet?.wallet?.address) {
      fetchAll();
    }
  }, [authLoading, walletLoading, wallet, fetchAll]);

  // ==========================================
  // 🔁 Periodinis fetch kas 30s + matomumo detektorius
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
  // 💲 Helperiai: USD, EUR ir natūralus balansas
  // ==========================================
  const getUsdBalance = (key) =>
    format((balances[key] || 0) * (prices[key]?.usd || 0), 2);

  const getEurBalance = (key) =>
    format((balances[key] || 0) * (prices[key]?.eur || 0), 2);

  const getFormattedBalance = (key) =>
    format(balances[key] || 0);

  // ==========================================
  // 🧠 Return: konteksto tiekimas vaikams
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

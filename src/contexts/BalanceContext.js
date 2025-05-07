"use client";

// ==========================================
// 📦 Importai – esmė veikimui
// ==========================================
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";

import { ethers, JsonRpcProvider, FallbackProvider } from "ethers";
import debounce from "lodash.debounce";
import { useAuth } from "@/contexts/AuthContext";
import fallbackRPCs from "@/utils/fallbackRPCs";

// ==========================================
// 🌐 Konteksto deklaravimas
// ==========================================
const BalanceContext = createContext(null);
export const useBalance = () => useContext(BalanceContext);

// ==========================================
// 🔗 Numatyti pradiniai tinklai (4+4)
// ==========================================
const DEFAULT_NETWORKS = [
  "eth", "bnb", "matic", "avax", // mainnetai
  "sepolia", "tbnb", "mumbai", "fuji", // testnetai
];

// ==========================================
// 💰 Token ID priskyrimas kiekvienam tinklui
// Naudojamas CoinGecko ir CoinCap API kainoms gauti
// ==========================================
const TOKEN_IDS = Object.fromEntries(
  Object.entries(fallbackRPCs).map(([key, { label }]) => {
    const id = label.toLowerCase().includes("eth") ? "ethereum"
      : label.toLowerCase().includes("matic") ? "polygon"
      : label.toLowerCase().includes("bnb") ? "binancecoin"
      : label.toLowerCase().includes("avax") ? "avalanche-2"
      : label.toLowerCase().includes("optimism") ? "optimism"
      : label.toLowerCase().includes("arbitrum") ? "arbitrum"
      : label.toLowerCase().includes("base") ? "base"
      : label.toLowerCase().includes("zksync") ? "zksync"
      : label.toLowerCase().includes("scroll") ? "scroll"
      : label.toLowerCase().includes("linea") ? "linea"
      : label.toLowerCase().includes("mantle") ? "mantle"
      : label.toLowerCase().includes("celo") ? "celo"
      : label.toLowerCase().includes("moonbeam") ? "moonbeam"
      : label.toLowerCase().includes("aurora") ? "aurora"
      : "ethereum"; // fallback
    return [key, id];
  })
);

// ==========================================
// 📈 Kainų fallback'ai (usd, eur) visiems tinklams
// ==========================================
const FALLBACK_PRICES = Object.fromEntries(
  Object.keys(TOKEN_IDS).map((key) => [key, { usd: 0, eur: 0 }])
);

// ==========================================
// ⏱️ Kainų TTL (milisekundėmis)
// ==========================================
const PRICE_TTL = 30_000;

// ==========================================
// 🔢 Skaičiaus formatavimas UI rodymui
// ==========================================
const format = (val, decimals = 5) => {
  if (typeof val !== "number" || isNaN(val)) return "0.00000";
  return Number(val).toFixed(decimals);
};

// ==========================================
// ✅ Sujungia default + enabledNetworks iš localStorage
// Tik jei tinklas egzistuoja fallbackRPCs – filtruojam nelegalius
// ==========================================
function getValidNetworks(localEnabled) {
  return [...new Set([
    ...DEFAULT_NETWORKS,
    ...(Array.isArray(localEnabled) ? localEnabled : []),
  ])].filter((key) => fallbackRPCs[key]);
}

// ==========================================
// 🧠 Pagrindinis BalanceProvider komponentas
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

  // 🗂️ Įgalinti tinklai pagal localStorage
  const enabledNetworks = useMemo(() => {
    try {
      const stored = JSON.parse(localStorage.getItem("enabledNetworks"));
      return getValidNetworks(stored);
    } catch {
      return DEFAULT_NETWORKS;
    }
  }, []);

  // 🛰️ Sukuriame FallbackProvider kiekvienam tinklui
  const providers = useMemo(() => {
    const out = {};
    for (const key of enabledNetworks) {
      const net = fallbackRPCs[key];
      if (net?.rpcs?.length) {
        try {
          out[key] = new FallbackProvider(
            net.rpcs.map((url) => new JsonRpcProvider(url))
          );
        } catch (err) {
          console.warn(`[Balance] ❌ Nepavyko sukurti providerio ${key}:`, err);
        }
      }
    }
    return out;
  }, [enabledNetworks]);

  // 🔠 Kainų ID sąrašas iš CoinGecko
  const coingeckoIds = useMemo(() => {
    return Array.from(new Set(Object.values(TOKEN_IDS))).join(",");
  }, []);

  // 💸 Atsisiunčiame ETH balansus iš kiekvieno tinklo naudodami FallbackProvider
  const fetchBalances = useCallback(async () => {
    const addr = wallet?.wallet?.address;
    if (!addr) return {};

    const out = {};

    await Promise.allSettled(
      Object.entries(providers).map(async ([key, provider]) => {
        try {
          const raw = await provider.getBalance(addr, "latest");
          out[key] = parseFloat(ethers.formatEther(raw));
        } catch (err) {
          console.warn(`[Balance] ❌ Nepavyko gauti balanso ${key}:`, err?.message);
          out[key] = 0;
        }
      })
    );

    return out;
  }, [wallet, providers]);

  // ==========================================
  // 💵 Gaunam kainas iš CoinGecko, su fallback į CoinCap jei reikia
  // ==========================================
  const fetchPrices = useCallback(async () => {
    const now = Date.now();
    if (now - lastPriceFetch.current < PRICE_TTL) return prices;

    try {
      // 🌍 CoinGecko API
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
      console.warn("[Balance] ❌ CoinGecko kainų klaida:", err?.message);

      // 🌍 Fallback į CoinCap API
      try {
        const fallbackRes = await fetch("https://api.coincap.io/v2/assets", {
          headers: { accept: "application/json" },
        });
        const { data } = await fallbackRes.json();

        const lookup = Object.fromEntries(
          data.map((item) => [item.id, Number(item.priceUsd) || 0])
        );

        const out = {};
        for (const [sym, id] of Object.entries(TOKEN_IDS)) {
          out[sym] = {
            usd: lookup[id] ?? 0,
            eur: 0, // CoinCap neturi EUR fallback – rodom 0
          };
        }

        lastPriceFetch.current = now;
        return out;
      } catch (err2) {
        console.error("[Balance] ❌ Abi kainų užklausos nepavyko:", err2?.message);
        return prices; // Grąžinam paskutines, fallback
      }
    }
  }, [coingeckoIds, prices]);

  // ==========================================
  // 🔁 Gaunam visus duomenis: balansus + kainas
  // Jei klaida – paleidžiam retry logiką
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

  // ==========================================
  // 🔁 Jei fetch nepavyksta – paleidžiam retry su exponential backoff
  // ==========================================
  const silentRetry = useCallback(() => {
    if (retryCount.current >= 6) return; // max 6 retry
    const delay = Math.min(2 ** retryCount.current * 3000, 60000); // 3s → 6s → 12s → max 60s

    console.warn(`[Balance] 🔁 Silent retry in ${Math.round(delay / 1000)}s...`);
    const id = setTimeout(() => fetchAll(true), delay);
    retryQueue.current.push(id);
    retryCount.current++;
  }, [fetchAll]);

  // ==========================================
  // 🎯 Auto fetch kai prisijungiama / kraunamas wallet
  // ==========================================
  useEffect(() => {
    if (!authLoading && !walletLoading && wallet?.wallet?.address) {
      fetchAll();
    }
  }, [authLoading, walletLoading, wallet, fetchAll]);

  // ==========================================
  // 🔁 Periodinis atnaujinimas kas 30s + kai matomas langas
  // ==========================================
  useEffect(() => {
    const interval = setInterval(() => {
      if (!silentLoading.current) fetchAll(true);
    }, 30_000);

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
  // 💲 Helperiai balansams: USD / EUR / RAW
  // ==========================================
  const getUsdBalance = (key) =>
    format((balances[key] || 0) * (prices[key]?.usd || 0), 2);

  const getEurBalance = (key) =>
    format((balances[key] || 0) * (prices[key]?.eur || 0), 2);

  const getFormattedBalance = (key) =>
    format(balances[key] || 0);

  // ==========================================
  // ✅ Returninam BalanceContext visiems vaikams
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

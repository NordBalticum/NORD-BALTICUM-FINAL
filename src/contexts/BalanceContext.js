"use client";

// ==========================================
// 💎 BALANCE CONTEXT – DIAMOND FINAL VERSION
// ==========================================

import {
  createContext, useContext, useState, useEffect,
  useCallback, useMemo, useRef
} from "react";

import { ethers, JsonRpcProvider, FallbackProvider } from "ethers";
import debounce from "lodash.debounce";
import { ERC20_ABI } from "@/utils/erc20ABI";
import networks from "@/data/networks";
import { useAuth } from "@/contexts/AuthContext";

// ==========================================
// 🧠 Context ir hook
// ==========================================
const BalanceContext = createContext(null);
export const useBalance = () => useContext(BalanceContext);

// ==========================================
// ⚙️ Konstanta: kainų TTL, retry
// ==========================================
const PRICE_TTL = 30000;
const MAX_RETRIES = 6;

const format = (v, d = 5) =>
  typeof v !== "number" || isNaN(v) ? "0.00000" : Number(v).toFixed(d);

// ==========================================
// 🌐 Provideriai: fallback iš networks
// ==========================================
const buildProviders = () => {
  const out = {};
  for (const net of networks) {
    if (!net?.value || !net?.rpcUrls?.length) continue;
    try {
      out[net.value] = new FallbackProvider(
        net.rpcUrls.map(url => new JsonRpcProvider(url))
      );
    } catch (err) {
      console.warn(`[Balance] ❌ Provider error: ${net.value}`, err.message);
    }

    if (net.testnet?.value && net.testnet?.rpcUrls?.length) {
      try {
        out[net.testnet.value] = new FallbackProvider(
          net.testnet.rpcUrls.map(url => new JsonRpcProvider(url))
        );
      } catch (err) {
        console.warn(`[Balance] ❌ Provider error: ${net.testnet.value}`, err.message);
      }
    }
  }
  return out;
};

// ==========================================
// 🧠 Main state'ai ir ref'ai
// ==========================================
export function BalanceProvider({ children }) {
  const { wallet, authLoading, walletLoading } = useAuth();

  const [balances, setBalances] = useState({});
  const [prices, setPrices] = useState({});
  const [loading, setLoading] = useState(true);
  const [balancesReady, setBalancesReady] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  const silentLoading = useRef(false);
  const retryCount = useRef(0);
  const retryQueue = useRef([]);
  const lastPriceFetch = useRef(0);

  const providers = useMemo(() => buildProviders(), []);

  // ==========================================
  // 💰 Native balansai
  // ==========================================
  const fetchNativeBalances = useCallback(async () => {
    const address = wallet?.wallet?.address;
    if (!address) return {};
    const out = {};

    await Promise.allSettled(
      Object.entries(providers).map(async ([key, provider]) => {
        try {
          const bal = await provider.getBalance(address);
          out[key] = parseFloat(ethers.formatEther(bal));
        } catch (err) {
          console.warn(`[Balance] ❌ Native balance fail: ${key}`, err?.message);
          out[key] = 0;
        }
      })
    );

    return out;
  }, [wallet, providers]);

  // ==========================================
  // 💰 ERC20 balansai per networks.js
  // ==========================================
  const fetchERC20Balances = useCallback(async () => {
    const address = wallet?.wallet?.address;
    if (!address) return {};
    const out = {};

    await Promise.allSettled(
      networks.map(async (net) => {
        const token = net.erc20;
        if (!token?.address || !ethers.isAddress(token.address)) return;

        const provider = providers[net.value];
        if (!provider) return;

        try {
          const contract = new ethers.Contract(token.address, ERC20_ABI, provider);
          const [decimals, raw] = await Promise.all([
            contract.decimals(),
            contract.balanceOf(address)
          ]);
          out[net.value + "_erc20"] = parseFloat(ethers.formatUnits(raw, decimals));
        } catch (err) {
          console.warn(`[Balance] ❌ ERC20 fail: ${net.value}`, err?.message);
          out[net.value + "_erc20"] = 0;
        }
      })
    );

    return out;
  }, [wallet, providers]);

  // ==========================================
  // 📈 CoinGecko kainos su CoinCap fallback
  // ==========================================
  const fetchPrices = useCallback(async () => {
    const now = Date.now();
    if (now - lastPriceFetch.current < PRICE_TTL) return prices;

    try {
      const ids = networks.map(n => n.coingeckoId).filter(Boolean);
      const res = await fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=${ids.join(",")}&vs_currencies=usd,eur`
      );
      const data = await res.json();

      const out = {};
      for (const net of networks) {
        const id = net.coingeckoId;
        out[net.value] = {
          usd: data[id]?.usd ?? 0,
          eur: data[id]?.eur ?? 0
        };
      }

      lastPriceFetch.current = now;
      return out;
    } catch (err) {
      console.warn("[Balance] ❌ CoinGecko error:", err?.message);

      // CoinCap fallback
      try {
        const res = await fetch("https://api.coincap.io/v2/assets");
        const { data } = await res.json();
        const lookup = Object.fromEntries(data.map(i => [i.id, Number(i.priceUsd) || 0]));
        const out = {};

        for (const net of networks) {
          const id = net.coincapId;
          out[net.value] = {
            usd: lookup[id] ?? 0,
            eur: 0
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
  // 🔁 fetchAll: native + ERC20 + kainos
  // ==========================================
  const fetchAll = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    silentLoading.current = true;

    try {
      const [native, erc20, priceData] = await Promise.all([
        fetchNativeBalances(),
        fetchERC20Balances(),
        fetchPrices()
      ]);
      setBalances({ ...native, ...erc20 });
      setPrices(priceData);
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
  // 🔁 Retry su exponential backoff
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
  // 🚀 Load on mount
  // ==========================================
  useEffect(() => {
    if (!authLoading && !walletLoading && wallet?.wallet?.address) {
      fetchAll();
    }
  }, [authLoading, walletLoading, wallet, fetchAll]);

  // ==========================================
  // ⏲️ 30s interval + tab visibility trigger
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
}

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

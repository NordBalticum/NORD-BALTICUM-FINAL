"use client";

import { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { SUPPORTED_NETWORKS } from "@/contexts/NetworkContext";
import { ethers } from "ethers";
import debounce from "lodash.debounce";

export const RPC = {
  eth: "https://rpc.ankr.com/eth",
  bnb: "https://bsc-dataseed.binance.org/",
  tbnb: "https://data-seed-prebsc-1-s1.binance.org:8545/",
  matic: "https://polygon-rpc.com",
  avax: "https://api.avax.network/ext/bc/C/rpc",
};

export const TOKEN_IDS = {
  eth: "ethereum",
  bnb: "binancecoin",
  tbnb: "binancecoin",
  matic: "polygon",
  avax: "avalanche-2",
};

const FALLBACK_PRICES = {
  eth: { eur: 2900, usd: 3100 },
  bnb: { eur: 450, usd: 480 },
  tbnb: { eur: 450, usd: 480 },
  matic: { eur: 1.5, usd: 1.6 },
  avax: { eur: 30, usd: 32 },
};

const BalanceContext = createContext();
export const useBalance = () => useContext(BalanceContext);

const BALANCE_KEY = "nordbalticum_balances";
const PRICE_KEY = "nordbalticum_prices";

export const BalanceProvider = ({ children }) => {
  const { wallet, authLoading, walletLoading } = useAuth();

  const [balances, setBalances] = useState({});
  const [prices, setPrices] = useState(FALLBACK_PRICES);
  const [loading, setLoading] = useState(true);

  const intervalRef = useRef(null);
  const lastKnownBalances = useRef({});

  const saveToLocal = (key, data) => {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch {}
  };

  const loadFromLocal = (key) => {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  };

  const fetchBalancesAndPrices = useCallback(async () => {
    if (!wallet?.wallet?.address) return;

    try {
      setLoading(true);
      const address = wallet.wallet.address;
      const newBalances = {};

      await Promise.all(
        Object.entries(RPC).map(async ([network, rpcUrl]) => {
          try {
            const provider = new ethers.JsonRpcProvider(rpcUrl);
            const balance = await provider.getBalance(address);
            newBalances[network] = parseFloat(ethers.formatEther(balance));
          } catch (error) {
            console.warn(`⚠️ Balance fetch failed for [${network}] – setting to 0.`);
            newBalances[network] = 0;
          }
        })
      );

      SUPPORTED_NETWORKS.forEach((network) => {
        if (newBalances[network] === undefined) {
          newBalances[network] = 0;
        }
      });

      setBalances(newBalances);
      saveToLocal(BALANCE_KEY, newBalances);
      lastKnownBalances.current = newBalances;

      const ids = Array.from(new Set(Object.values(TOKEN_IDS))).join(",");
      const res = await fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=eur,usd`,
        { cache: "no-store" }
      );

      if (!res.ok) throw new Error("Failed to fetch prices from CoinGecko");

      const data = await res.json();
      const newPrices = {};

      for (const [symbol, id] of Object.entries(TOKEN_IDS)) {
        newPrices[symbol] = {
          eur: data[id]?.eur ?? FALLBACK_PRICES[symbol].eur,
          usd: data[id]?.usd ?? FALLBACK_PRICES[symbol].usd,
        };
      }

      setPrices(newPrices);
      saveToLocal(PRICE_KEY, newPrices);
    } catch (error) {
      console.error("❌ Critical error in fetchBalancesAndPrices:", error.message);
    } finally {
      setLoading(false);
    }
  }, [wallet]);

  const detectBalanceChanges = useCallback(async () => {
    if (!wallet?.wallet?.address) return;
    const address = wallet.wallet.address;
    const updated = {};

    await Promise.all(
      Object.entries(RPC).map(async ([network, rpcUrl]) => {
        try {
          const provider = new ethers.JsonRpcProvider(rpcUrl);
          const balance = await provider.getBalance(address);
          updated[network] = parseFloat(ethers.formatEther(balance));
        } catch {
          updated[network] = 0;
        }
      })
    );

    let hasChanged = false;
    for (const key of SUPPORTED_NETWORKS) {
      const oldVal = lastKnownBalances.current?.[key] || 0;
      const newVal = updated[key] || 0;
      if (Math.abs(oldVal - newVal) > 0.000001) {
        hasChanged = true;
        break;
      }
    }

    if (hasChanged) {
      console.log("🔁 Detected balance change – refreshing...");
      fetchBalancesAndPrices();
    }
  }, [wallet, fetchBalancesAndPrices]);

  useEffect(() => {
    const cachedBalances = loadFromLocal(BALANCE_KEY);
    const cachedPrices = loadFromLocal(PRICE_KEY);
    if (cachedBalances) setBalances(cachedBalances);
    if (cachedPrices) setPrices(cachedPrices);
    lastKnownBalances.current = cachedBalances || {};
  }, []);

  useEffect(() => {
    if (authLoading || walletLoading || !wallet?.wallet?.address) return;

    fetchBalancesAndPrices();

    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      detectBalanceChanges();
    }, 15000);

    return () => clearInterval(intervalRef.current);
  }, [authLoading, walletLoading, wallet, fetchBalancesAndPrices, detectBalanceChanges]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleVisibilityChange = debounce(async () => {
      if (document.visibilityState === "visible") {
        console.log("🔁 Tab visible – refreshing balances...");
        await fetchBalancesAndPrices();
      }
    }, 500);

    const handleOnline = debounce(async () => {
      console.log("🔁 Network online – refreshing balances...");
      await fetchBalancesAndPrices();
    }, 500);

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("online", handleOnline);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("online", handleOnline);
    };
  }, [fetchBalancesAndPrices]);

  return (
    <BalanceContext.Provider
      value={{
        balances,
        prices,
        loading,
        refetch: fetchBalancesAndPrices,
      }}
    >
      {children}
    </BalanceContext.Provider>
  );
};

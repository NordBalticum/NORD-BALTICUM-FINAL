"use client";

import { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import { ethers } from "ethers";
import { useAuth } from "@/contexts/AuthContext";

const BalanceContext = createContext();
export const useBalance = () => useContext(BalanceContext);

// ✅ Kiekvieno tinklo RPC
const RPC = {
  eth: "https://rpc.ankr.com/eth",
  bnb: "https://bsc-dataseed.binance.org/",
  tbnb: "https://data-seed-prebsc-1-s1.binance.org:8545/",
  matic: "https://polygon-rpc.com",
  avax: "https://api.avax.network/ext/bc/C/rpc",
};

// ✅ Token mapping
const TOKEN_IDS = {
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

export const BalanceProvider = ({ children }) => {
  const { wallet, authLoading, walletLoading } = useAuth();
  const [balances, setBalances] = useState({});
  const [prices, setPrices] = useState(FALLBACK_PRICES);
  const [loading, setLoading] = useState(true);
  const intervalRef = useRef(null);

  const fetchBalancesAndPrices = useCallback(async () => {
    if (!wallet?.wallet?.address) return;

    try {
      const address = wallet.wallet.address;
      const newBalances = {};

      // ✅ Einam per kiekvieną tinklą
      await Promise.all(Object.entries(RPC).map(async ([network, rpcUrl]) => {
        const provider = new ethers.JsonRpcProvider(rpcUrl);
        const balance = await provider.getBalance(address);
        newBalances[network] = {
          balance: parseFloat(ethers.formatEther(balance)),
          symbol: network.toUpperCase(),
        };
      }));

      setBalances(newBalances);

      // ✅ Fetch CoinGecko prices
      const ids = Array.from(new Set(Object.values(TOKEN_IDS))).join(",");
      const res = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=eur,usd`, {
        cache: "no-store",
      });

      if (!res.ok) throw new Error("Failed to fetch prices");

      const data = await res.json();
      const priceMap = {};

      for (const [symbol, id] of Object.entries(TOKEN_IDS)) {
        priceMap[symbol] = {
          eur: data[id]?.eur ?? FALLBACK_PRICES[symbol].eur,
          usd: data[id]?.usd ?? FALLBACK_PRICES[symbol].usd,
        };
      }

      setPrices(priceMap);
    } catch (err) {
      console.error("❌ BalanceContext fetch error:", err.message || err);
    } finally {
      setLoading(false);
    }
  }, [wallet]);

  useEffect(() => {
    if (authLoading || walletLoading) return; // ✅ Palaukiam auth
    if (!wallet?.wallet?.address) return;

    fetchBalancesAndPrices();

    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(fetchBalancesAndPrices, 30000);

    return () => clearInterval(intervalRef.current);
  }, [authLoading, walletLoading, wallet, fetchBalancesAndPrices]);

  return (
    <BalanceContext.Provider value={{
      balances,
      prices,
      loading,
      refetch: fetchBalancesAndPrices,
    }}>
      {children}
    </BalanceContext.Provider>
  );
};

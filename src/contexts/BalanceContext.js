"use client";

import { createContext, useContext, useState, useEffect, useRef, useCallback } from "react";
import { ethers } from "ethers";
import { useAuth } from "@/contexts/AuthContext";

// ✅ CoinGecko token mapping
const TOKEN_IDS = {
  eth: "ethereum",
  bnb: "binancecoin",
  tbnb: "binancecoin", // tbnb = bnb price
  matic: "polygon",
  avax: "avalanche-2",
};

// ✅ Fallback kainos (jei CoinGecko nulūžtų)
const FALLBACK_PRICES = {
  eth: { eur: 2900, usd: 3100 },
  bnb: { eur: 450, usd: 480 },
  tbnb: { eur: 450, usd: 480 },
  matic: { eur: 1.5, usd: 1.6 },
  avax: { eur: 30, usd: 32 },
};

// ✅ Context sukūrimas
const BalanceContext = createContext();
export const useBalance = () => useContext(BalanceContext);

// ✅ Provideris
export const BalanceProvider = ({ children }) => {
  const { wallet } = useAuth();

  const [balances, setBalances] = useState({});
  const [prices, setPrices] = useState(FALLBACK_PRICES);
  const [firstLoading, setFirstLoading] = useState(true);
  const [silentLoading, setSilentLoading] = useState(false);
  const [error, setError] = useState(null);

  const intervalRef = useRef(null);

  // ✅ Fetch funkcija
  const fetchBalancesAndPrices = useCallback(async () => {
    if (!wallet?.signers) return;

    try {
      setSilentLoading(true);
      setError(null);

      // ✅ Fetch Balances
      const balancesData = await Promise.all(
        Object.entries(wallet.signers).map(async ([network, signer]) => {
          try {
            const balance = await signer.getBalance();
            return { network, balance: parseFloat(ethers.formatEther(balance)) };
          } catch (err) {
            console.error(`❌ Balance fetch error [${network}]:`, err?.message || err);
            return { network, balance: 0 };
          }
        })
      );

      const newBalances = {};
      balancesData.forEach(({ network, balance }) => {
        newBalances[network] = balance;
      });
      setBalances(newBalances);

      // ✅ Fetch Prices
      const uniqueIds = Array.from(new Set(Object.values(TOKEN_IDS))).join(",");
      const res = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${uniqueIds}&vs_currencies=eur,usd`, {
        cache: "no-store",
      });

      if (!res.ok) throw new Error("Failed to fetch prices from CoinGecko.");

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
      console.error("❌ Balance/Price fetch error:", err?.message || err);
      setError(err?.message || "Failed to load balances/prices.");
      setPrices(FALLBACK_PRICES); // fallback
    } finally {
      setSilentLoading(false);
      setFirstLoading(false);
    }
  }, [wallet]);

  // ✅ Automatizuotas Refresh
  useEffect(() => {
    if (wallet?.signers) {
      fetchBalancesAndPrices(); // ✅ Pirmas pakrovimas

      if (intervalRef.current) clearInterval(intervalRef.current);

      intervalRef.current = setInterval(fetchBalancesAndPrices, 30000); // ✅ Silent refresh kas 30s
      return () => clearInterval(intervalRef.current);
    }
  }, [wallet, fetchBalancesAndPrices]);

  // ✅ Gauti balansą USD
  const getUsdBalance = (network) => {
    const balance = balances?.[network] || 0;
    const price = prices?.[network]?.usd || 0;
    return (balance * price).toFixed(2);
  };

  // ✅ Gauti balansą EUR
  const getEurBalance = (network) => {
    const balance = balances?.[network] || 0;
    const price = prices?.[network]?.eur || 0;
    return (balance * price).toFixed(2);
  };

  // ✅ Sumuoti visą portfelį
  const getPortfolioValue = () => {
    let totalEur = 0;
    let totalUsd = 0;

    Object.keys(balances).forEach((network) => {
      const balance = balances[network] || 0;
      const eurPrice = prices?.[network]?.eur || 0;
      const usdPrice = prices?.[network]?.usd || 0;

      totalEur += balance * eurPrice;
      totalUsd += balance * usdPrice;
    });

    return {
      eur: totalEur.toFixed(2),
      usd: totalUsd.toFixed(2),
    };
  };

  return (
    <BalanceContext.Provider
      value={{
        balances,
        prices,
        loading: firstLoading,
        silentLoading,
        error,
        refetch: fetchBalancesAndPrices,
        getUsdBalance,
        getEurBalance,
        getPortfolioValue,
      }}
    >
      {children}
    </BalanceContext.Provider>
  );
};

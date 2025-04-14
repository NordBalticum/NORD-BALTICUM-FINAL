"use client";

import { createContext, useContext, useState, useEffect, useRef, useCallback } from "react";
import { ethers } from "ethers";
import { useAuth } from "@/contexts/AuthContext";

// ✅ CoinGecko token mapping
const TOKEN_IDS = {
  eth: "ethereum",
  bnb: "binancecoin",
  tbnb: "binancecoin", 
  matic: "polygon",
  avax: "avalanche-2",
};

// ✅ Fallback kainos
const FALLBACK_PRICES = {
  eth: { eur: 2900, usd: 3100 },
  bnb: { eur: 450, usd: 480 },
  tbnb: { eur: 450, usd: 480 },
  matic: { eur: 1.5, usd: 1.6 },
  avax: { eur: 30, usd: 32 },
};

// ✅ Context
const BalanceContext = createContext();
export const useBalance = () => useContext(BalanceContext);

export const BalanceProvider = ({ children }) => {
  const { wallet, authLoading } = useAuth(); // ✅ Imame ir authLoading!

  const [balances, setBalances] = useState({});
  const [prices, setPrices] = useState(FALLBACK_PRICES);
  const [firstLoading, setFirstLoading] = useState(true);
  const [silentLoading, setSilentLoading] = useState(false);
  const [error, setError] = useState(null);

  const intervalRef = useRef(null);

  const fetchBalancesAndPrices = useCallback(async () => {
    if (!wallet?.signers) return;

    try {
      setSilentLoading(true);
      setError(null);

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

      // ✅ Fetch kainos
      const ids = Array.from(new Set(Object.values(TOKEN_IDS))).join(",");
      const res = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=eur,usd`, {
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
      setPrices(FALLBACK_PRICES);
    } finally {
      setSilentLoading(false);
      setFirstLoading(false);
    }
  }, [wallet]);

  // ✅ Pataisytas useEffect
  useEffect(() => {
    if (authLoading) return; // ⛔️ Jei auth kraunasi – nebandyti fetchint!

    if (wallet?.signers) {
      fetchBalancesAndPrices(); // ✅ Pirmas kartas

      if (intervalRef.current) clearInterval(intervalRef.current);

      intervalRef.current = setInterval(fetchBalancesAndPrices, 30000); // ✅ Silent refresh kas 30s
      return () => clearInterval(intervalRef.current);
    }
  }, [wallet, authLoading, fetchBalancesAndPrices]);

  // ✅ Skaičiavimai
  const getUsdBalance = (network) => {
    const balance = balances?.[network] || 0;
    const price = prices?.[network]?.usd || 0;
    return (balance * price).toFixed(2);
  };

  const getEurBalance = (network) => {
    const balance = balances?.[network] || 0;
    const price = prices?.[network]?.eur || 0;
    return (balance * price).toFixed(2);
  };

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
    <BalanceContext.Provider value={{
      balances,
      prices,
      loading: firstLoading,
      silentLoading,
      error,
      refetch: fetchBalancesAndPrices,
      getUsdBalance,
      getEurBalance,
      getPortfolioValue,
    }}>
      {children}
    </BalanceContext.Provider>
  );
};

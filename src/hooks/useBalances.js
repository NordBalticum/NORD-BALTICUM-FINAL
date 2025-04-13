"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { ethers } from "ethers";
import { RPC } from "@/contexts/AuthContext"; // ✅ RPC sąrašas
import { useAuth } from "@/contexts/AuthContext"; // ✅ Vartotojo wallet

// ✅ CoinGecko Token IDs
const TOKEN_IDS = {
  eth: "ethereum",
  bnb: "binancecoin",
  tbnb: "binancecoin", // tbnb = bnb price
  matic: "polygon",
  avax: "avalanche-2",
};

// ✅ Fallback kainos jeigu CoinGecko nulūžtų
const FALLBACK_PRICES = {
  eth: { eur: 2900, usd: 3100 },
  bnb: { eur: 450, usd: 480 },
  tbnb: { eur: 450, usd: 480 },
  matic: { eur: 1.5, usd: 1.6 },
  avax: { eur: 30, usd: 32 },
};

export function useBalances() {
  const { wallet } = useAuth();
  const [balances, setBalances] = useState({});
  const [prices, setPrices] = useState(FALLBACK_PRICES);
  const [firstLoading, setFirstLoading] = useState(true);
  const [silentLoading, setSilentLoading] = useState(false);
  const [error, setError] = useState(null);
  const intervalRef = useRef(null);

  const fetchBalancesAndPrices = useCallback(async () => {
    if (!wallet || !wallet.signers) return;

    try {
      setSilentLoading(true);
      setError(null);

      // ✅ Fetch Balances
      const balancePromises = Object.entries(wallet.signers).map(async ([network, signer]) => {
        try {
          const balance = await signer.getBalance();
          return { network, balance: parseFloat(ethers.formatEther(balance)) };
        } catch (err) {
          console.error(`❌ Balance fetch error on ${network}:`, err.message);
          return { network, balance: 0 };
        }
      });

      const balancesData = await Promise.all(balancePromises);
      const newBalances = {};
      balancesData.forEach(({ network, balance }) => {
        newBalances[network] = balance;
      });
      setBalances(newBalances);

      // ✅ Fetch Prices
      const ids = Array.from(new Set(Object.values(TOKEN_IDS))).join(",");
      const res = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=eur,usd`, {
        cache: "no-store",
      });

      if (!res.ok) throw new Error("Failed to fetch prices.");

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
      console.error("❌ Fetch balances/prices error:", err.message || err);
      setError(err.message || "Failed to load balances and prices.");
      setPrices(FALLBACK_PRICES);
    } finally {
      setSilentLoading(false);
      setFirstLoading(false);
    }
  }, [wallet]);

  // ✅ Automatinis Silent Refresh
  useEffect(() => {
    if (wallet) {
      fetchBalancesAndPrices(); // ✅ Pirmas pakrovimas

      intervalRef.current = setInterval(fetchBalancesAndPrices, 30000); // ✅ Kas 30 sekundžių fone
      return () => clearInterval(intervalRef.current);
    }
  }, [wallet, fetchBalancesAndPrices]);

  // ✅ Gauti balanso vertę USD
  const getUsdBalance = (network) => {
    const balance = balances?.[network] || 0;
    const price = prices?.[network]?.usd || 0;
    return (balance * price).toFixed(2);
  };

  // ✅ Gauti balanso vertę EUR
  const getEurBalance = (network) => {
    const balance = balances?.[network] || 0;
    const price = prices?.[network]?.eur || 0;
    return (balance * price).toFixed(2);
  };

  // ✅ Sumuoti bendrą portfelį
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

  return {
    balances,
    prices,
    loading: firstLoading,        // ✅ Tik pirmą kartą rodys spinnerį
    silentLoading,                // ✅ Fone besikraunantis statusas
    error,
    refetch: fetchBalancesAndPrices,
    getUsdBalance,
    getEurBalance,
    getPortfolioValue,
  };
}

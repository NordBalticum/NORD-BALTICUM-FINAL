"use client";

import { useEffect, useState, useCallback } from "react";

// ✅ Token mapping su CoinGecko ID
const TOKEN_IDS = {
  ethereum: "ethereum",
  bsc: "binancecoin",
  matic: "matic-network",
  avalanche: "avalanche-2",
  tbnb: "binancecoin", // TBNB = BNB (naudojam BNB kainą)
};

// ✅ Atsarginės (fallback) kainos
const FALLBACK_PRICES = {
  ethereum: 2900,
  bsc: 450,
  matic: 1.5,
  avalanche: 30,
  tbnb: 450,
};

// ✅ Ultimate Price Hook
export function usePrices() {
  const [prices, setPrices] = useState(FALLBACK_PRICES); // ✅ Startuoja su fallback
  const [loading, setLoading] = useState(true);

  const fetchPrices = useCallback(async () => {
    try {
      const ids = Object.values(TOKEN_IDS).join(",");
      const response = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=eur`, {
        cache: "no-store", // ✅ Neima cache
      });

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      const data = await response.json();
      const formatted = {};

      for (const [symbol, id] of Object.entries(TOKEN_IDS)) {
        formatted[symbol] = data[id]?.eur || FALLBACK_PRICES[symbol];
      }

      setPrices(formatted);
    } catch (error) {
      console.error("❌ Live price fetch failed:", error.message);
      setPrices(FALLBACK_PRICES);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPrices(); // ✅ Užkraunam kai komponentas mountinasi

    const interval = setInterval(fetchPrices, 15000); // ✅ Auto-refresh kas 15s
    return () => clearInterval(interval);
  }, [fetchPrices]);

  return { prices, loading };
}

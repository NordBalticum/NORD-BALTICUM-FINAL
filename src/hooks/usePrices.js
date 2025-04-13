"use client";

import { useEffect, useState, useCallback } from "react";

// ✅ Token mapping su CoinGecko ID
const TOKEN_IDS = {
  ethereum: "ethereum",
  bsc: "binancecoin",
  polygon: "matic-network",
  avalanche: "avalanche-2",
  tbnb: "binancecoin", // TBNB = BNB
};

// ✅ Atsarginės kainos
const FALLBACK_PRICES = {
  ethereum: { eur: 2900, usd: 3100 },
  bsc: { eur: 450, usd: 480 },
  polygon: { eur: 1.5, usd: 1.6 },
  avalanche: { eur: 30, usd: 32 },
  tbnb: { eur: 450, usd: 480 },
};

// ✅ Ultimate Price Hook
export function usePrices() {
  const [prices, setPrices] = useState(FALLBACK_PRICES);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchPrices = useCallback(async () => {
    if (typeof window === "undefined") return;

    try {
      setLoading(true);

      const ids = Object.values(TOKEN_IDS).join(",");
      const res = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=eur,usd`, {
        cache: "no-store",
      });

      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);

      const data = await res.json();
      const updatedPrices = {};

      for (const [symbol, id] of Object.entries(TOKEN_IDS)) {
        updatedPrices[symbol] = {
          eur: data[id]?.eur ?? FALLBACK_PRICES[symbol].eur,
          usd: data[id]?.usd ?? FALLBACK_PRICES[symbol].usd,
        };
      }

      setPrices(updatedPrices);
      setError(null);
    } catch (err) {
      console.error("❌ Price fetch error:", err.message);
      setPrices(FALLBACK_PRICES);
      setError(err.message || "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    fetchPrices();

    const interval = setInterval(fetchPrices, 30000);
    return () => clearInterval(interval);
  }, [fetchPrices]);

  return {
    prices,
    loading,
    error,
    refetch: fetchPrices,
  };
}

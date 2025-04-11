"use client";

import { useEffect, useState, useCallback } from "react";

// ✅ Token mapping su CoinGecko ID
const TOKEN_IDS = {
  ethereum: "ethereum",
  bsc: "binancecoin",
  polygon: "matic-network",
  avalanche: "avalanche-2",
  tbnb: "binancecoin", // TBNB = BNB kaina
};

// ✅ Atsarginės (fallback) kainos
const FALLBACK_PRICES = {
  ethereum: { eur: 2900, usd: 3100 },
  bsc: { eur: 450, usd: 480 },
  polygon: { eur: 1.5, usd: 1.6 },
  avalanche: { eur: 30, usd: 32 },
  tbnb: { eur: 450, usd: 480 },
};

// ✅ Ultimate Price Hook
export function usePrices() {
  const [prices, setPrices] = useState(FALLBACK_PRICES); // ✅ Startuoja iškart su fallback
  const [loading, setLoading] = useState(true);

  const fetchPrices = useCallback(async () => {
    try {
      const ids = Object.values(TOKEN_IDS).join(",");
      const res = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=eur,usd`, {
        cache: "no-store", // ✅ Visiškai šviežia data
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
    } catch (error) {
      console.error("❌ Live price fetch failed:", error.message);
      setPrices(FALLBACK_PRICES); // ✅ Jei error, fallback
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPrices(); // ✅ Initial load

    const interval = setInterval(fetchPrices, 15000); // ✅ Auto-refresh kas 15s

    return () => clearInterval(interval);
  }, [fetchPrices]);

  return {
    prices,
    loading,
    refetch: fetchPrices, // ✅ Jei reikės kažkur rankiniu būdu atnaujinti
  };
}

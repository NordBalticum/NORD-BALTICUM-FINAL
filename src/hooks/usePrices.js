"use client";

import { useEffect, useState, useCallback, useRef } from "react";

// ✅ Token mapping su CoinGecko ID
const TOKEN_IDS = {
  ethereum: "ethereum",
  bsc: "binancecoin",
  polygon: "matic-network",
  avalanche: "avalanche-2",
  tbnb: "binancecoin", // ✅ tbnb = bsc kaina
};

// ✅ Atsarginės kainos fallback
const FALLBACK_PRICES = {
  ethereum: { eur: 2900, usd: 3100 },
  bsc: { eur: 450, usd: 480 },
  polygon: { eur: 1.5, usd: 1.6 },
  avalanche: { eur: 30, usd: 32 },
  tbnb: { eur: 450, usd: 480 },
};

export function usePrices() {
  const [prices, setPrices] = useState(FALLBACK_PRICES);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const mountedRef = useRef(false);

  const fetchPrices = useCallback(async () => {
    if (typeof window === "undefined") return;

    try {
      setLoading(true);

      const ids = Object.values(TOKEN_IDS).join(",");
      const res = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=eur,usd`, {
        cache: "no-store",
      });

      if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);

      const data = await res.json();
      const newPrices = {};

      for (const [symbol, id] of Object.entries(TOKEN_IDS)) {
        newPrices[symbol] = {
          eur: data[id]?.eur ?? FALLBACK_PRICES[symbol].eur,
          usd: data[id]?.usd ?? FALLBACK_PRICES[symbol].usd,
        };
      }

      if (mountedRef.current) {
        setPrices(newPrices);
        setError(null);
      }
    } catch (err) {
      console.error("❌ Price fetch error:", err.message);
      if (mountedRef.current) {
        setPrices(FALLBACK_PRICES);
        setError(err.message || "Unknown error");
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    fetchPrices(); // ✅ Iškart užkraunam

    const interval = setInterval(fetchPrices, 30000); // ✅ kas 30s automatinis refresh
    return () => {
      mountedRef.current = false;
      clearInterval(interval);
    };
  }, [fetchPrices]);

  return {
    prices,
    loading,
    error,
    refetch: fetchPrices,
  };
}

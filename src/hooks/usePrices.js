"use client";

import { useEffect, useState, useCallback, useRef } from "react";

// ✅ CoinGecko Token IDs
const TOKEN_IDS = {
  ethereum: "ethereum",
  bsc: "binancecoin",
  polygon: "matic-network",
  avalanche: "avalanche-2",
  tbnb: "binancecoin", // TBNB = BNB kaina
};

// ✅ Atsarginės kainos (fallback)
const FALLBACK_PRICES = {
  ethereum: { eur: 2900, usd: 3100 },
  bsc: { eur: 450, usd: 480 },
  polygon: { eur: 1.5, usd: 1.6 },
  avalanche: { eur: 30, usd: 32 },
  tbnb: { eur: 450, usd: 480 },
};

// ✅ Ultimate Price Hook
export function usePrices() {
  const [prices, setPrices] = useState(FALLBACK_PRICES); // ✅ Startuoja su fallback
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const mountedRef = useRef(false);

  const fetchPrices = useCallback(async () => {
    if (!mountedRef.current) return; // ✅ Protection jei unmounted

    try {
      setLoading(true);
      const ids = Object.values(TOKEN_IDS).join(",");

      const res = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=eur,usd`, {
        cache: "no-store", // ✅ Visada šviežia
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
      console.error("❌ Price fetch error:", err.message || err);
      setPrices(FALLBACK_PRICES); // ✅ Jei error – fallback
      setError(err.message || "Unknown error");
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    fetchPrices(); // ✅ Load first time

    const interval = setInterval(fetchPrices, 30000); // ✅ Kas 30 sekundžių
    return () => {
      mountedRef.current = false;
      clearInterval(interval); // ✅ Clean interval
    };
  }, [fetchPrices]);

  return {
    prices,
    loading,
    error,
    refetch: fetchPrices, // ✅ Galima rankiniu būdu pasikrauti dar kartą
  };
}

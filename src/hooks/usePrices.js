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

// ✅ Atsarginės kainos (fallback jei API neveiktų)
const FALLBACK_PRICES = {
  ethereum: { eur: 2900, usd: 3100 },
  bsc: { eur: 450, usd: 480 },
  polygon: { eur: 1.5, usd: 1.6 },
  avalanche: { eur: 30, usd: 32 },
  tbnb: { eur: 450, usd: 480 },
};

// ✅ ULTIMATE Price Hook
export function usePrices() {
  const [prices, setPrices] = useState(FALLBACK_PRICES); // ✅ Startuoja iškart su fallback kainom
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null); // ✅ Extra kontrolė error'ams

  const fetchPrices = useCallback(async () => {
    try {
      setLoading(true); // ✅ Nustatom kad krauna

      const ids = Object.values(TOKEN_IDS).join(",");
      const res = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=eur,usd`, {
        cache: "no-store", // ✅ Visada šviežia data
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
      setError(null); // ✅ Nėra klaidų
    } catch (err) {
      console.error("❌ Price fetch error:", err.message);
      setPrices(FALLBACK_PRICES); // ✅ Jei klaida, automatiškai grįžtam į fallback
      setError(err.message || "Unknown error");
    } finally {
      setLoading(false); // ✅ Baigė krautis
    }
  }, []);

  useEffect(() => {
    fetchPrices(); // ✅ Iškart pirmą kartą užkraunam

    const interval = setInterval(fetchPrices, 30000); // ✅ Atrodo švariau: 30s refresh (nereikia kas 15s)
    return () => clearInterval(interval); // ✅ Švarinam intervalą kai unmount
  }, [fetchPrices]);

  return {
    prices,
    loading,
    error,
    refetch: fetchPrices, // ✅ Galima rankiniu būdu dar kartą pakrauti jei reikia
  };
}

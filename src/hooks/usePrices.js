"use client";

import { useEffect, useState } from "react";

// ✅ Token mapping su CoinGecko ID
const TOKEN_IDS = {
  ethereum: "ethereum",
  bsc: "binancecoin",
  polygon: "polygon",
  avalanche: "avalanche-2",
  tbnb: "binancecoin", // TBNB = testnet BNB, imsim kaip BNB
};

// ✅ Hook'as gyvoms kainoms
export function usePrices() {
  const [prices, setPrices] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPrices = async () => {
      try {
        const ids = Object.values(TOKEN_IDS).join(",");
        const response = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=eur`);
        const data = await response.json();

        const formatted = {};
        for (const [symbol, id] of Object.entries(TOKEN_IDS)) {
          formatted[symbol] = data[id]?.eur || 0;
        }

        setPrices(formatted);
        setLoading(false);
      } catch (error) {
        console.error("❌ Price fetch error:", error.message);
      }
    };

    fetchPrices(); // ✅ Pirmas uzkrovimas

    const interval = setInterval(fetchPrices, 10000); // ✅ Auto-refresh kas 10 sekundžių
    return () => clearInterval(interval);
  }, []);

  return { prices, loading };
}

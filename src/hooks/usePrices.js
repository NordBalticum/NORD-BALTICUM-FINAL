"use client";

import { useEffect, useState } from "react";

// ✅ Token mapping su Coingecko ID
const tokenMapping = {
  eth: "ethereum",
  bnb: "binancecoin",
  tbnb: "binancecoin", // testnet bnb naudoja tą patį ID
  matic: "polygon",
  avax: "avalanche-2",
};

export function usePrices() {
  const [prices, setPrices] = useState({});
  const [loading, setLoading] = useState(true);

  const fetchPrices = async () => {
    try {
      const ids = Object.values(tokenMapping).join(",");
      const response = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=eur`);
      const data = await response.json();

      const newPrices = {};
      for (const [symbol, id] of Object.entries(tokenMapping)) {
        newPrices[symbol] = data[id]?.eur || 0;
      }

      setPrices(newPrices);
      setLoading(false);
    } catch (error) {
      console.error("❌ Failed to fetch live prices:", error.message);
    }
  };

  useEffect(() => {
    fetchPrices(); // ✅ Pradinis užkrovimas
    const interval = setInterval(fetchPrices, 60000); // ✅ Auto-refresh kas 60 sek.
    return () => clearInterval(interval);
  }, []);

  return { prices, loading };
}

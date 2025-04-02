// utils/fetchPrices.js

export const fetchPrices = async () => {
  try {
    const ids = {
      bsc: "binancecoin",
      tbnb: "binancecoin", // same price as bsc
      eth: "ethereum",
      polygon: "matic-network",
      avax: "avalanche-2",
    };

    const query = Object.values(ids).join(",");
    const res = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${query}&vs_currencies=eur`
    );

    const data = await res.json();

    return {
      bsc: data["binancecoin"]?.eur || 0,
      tbnb: data["binancecoin"]?.eur || 0,
      eth: data["ethereum"]?.eur || 0,
      polygon: data["matic-network"]?.eur || 0,
      avax: data["avalanche-2"]?.eur || 0,
    };
  } catch (err) {
    console.error("❌ Failed to fetch prices:", err.message);
    return {};
  }
};

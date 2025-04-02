export const fetchPrices = async () => {
  try {
    const ids = [
      "binancecoin",       // BNB & TBNB
      "ethereum",          // ETH
      "matic-network",     // Polygon
      "avalanche-2"        // AVAX
    ].join(",");

    const res = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=eur`
    );

    const data = await res.json();

    return {
      BSC: data["binancecoin"]?.eur || 0,
      TBNB: data["binancecoin"]?.eur || 0,
      ETH: data["ethereum"]?.eur || 0,
      POLYGON: data["matic-network"]?.eur || 0,
      AVAX: data["avalanche-2"]?.eur || 0,
    };
  } catch (err) {
    console.error("❌ Failed to fetch prices:", err.message);
    return {
      BSC: 0,
      TBNB: 0,
      ETH: 0,
      POLYGON: 0,
      AVAX: 0,
    };
  }
};

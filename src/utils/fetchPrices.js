// utils/fetchPrices.js
export const fetchPrices = async () => {
  try {
    const ids = "binancecoin,ethereum,matic-network,avalanche-2";
    const res = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=eur`);
    const data = await res.json();

    return {
      BNB: data["binancecoin"]?.eur || 0,
      ETH: data["ethereum"]?.eur || 0,
      MATIC: data["matic-network"]?.eur || 0,
      AVAX: data["avalanche-2"]?.eur || 0,
      TBNB: data["binancecoin"]?.eur || 0, // dummy
    };
  } catch {
    return {};
  }
};

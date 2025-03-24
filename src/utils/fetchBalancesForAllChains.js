import { ethers } from "ethers";

const rpcURLs = {
  BNB: "https://bsc-dataseed.binance.org/",
  TBNB: "https://data-seed-prebsc-1-s1.binance.org:8545/",
  ETH: "https://eth.llamarpc.com",
  POL: "https://polygon-rpc.com",
  AVAX: "https://api.avax.network/ext/bc/C/rpc",
};

const priceSymbols = {
  BNB: "binancecoin",
  TBNB: "binancecoin",
  ETH: "ethereum",
  POL: "polygon",
  AVAX: "avalanche-2",
};

export async function fetchBalancesForAllChains(address) {
  const balances = {};
  const prices = await fetchPrices();

  await Promise.all(
    Object.entries(rpcURLs).map(async ([symbol, url]) => {
      try {
        const provider = new ethers.providers.JsonRpcProvider(url);
        const balance = await provider.getBalance(address);
        const formatted = ethers.utils.formatEther(balance);
        const price = prices[priceSymbols[symbol]] || 0;
        balances[symbol] = {
          amount: parseFloat(formatted).toFixed(4),
          eur: (parseFloat(formatted) * price).toFixed(2),
        };
      } catch (err) {
        balances[symbol] = { amount: "0.0000", eur: "0.00" };
      }
    })
  );

  return balances;
}

async function fetchPrices() {
  try {
    const ids = Object.values(priceSymbols).join("%2C");
    const url = `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=eur`;
    const res = await fetch(url);
    const data = await res.json();
    const prices = {};
    for (const key of Object.values(priceSymbols)) {
      prices[key] = data[key]?.eur || 0;
    }
    return prices;
  } catch (error) {
    return {};
  }
}

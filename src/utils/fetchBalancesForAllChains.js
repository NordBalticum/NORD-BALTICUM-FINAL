import { ethers } from "ethers";
import { supabase } from "@/lib/supabase";

// === RPC URL'ai kiekvienam tinklui
const rpcURLs = {
  BNB: "https://bsc-dataseed.binance.org/",
  TBNB: "https://data-seed-prebsc-1-s1.binance.org:8545/",
  ETH: "https://eth.llamarpc.com",
  MATIC: "https://polygon-rpc.com",
  AVAX: "https://api.avax.network/ext/bc/C/rpc",
};

// === CoinGecko ID'ai kiekvienam simboliui
const priceSymbols = {
  BNB: "binancecoin",
  TBNB: "binancecoin",
  ETH: "ethereum",
  MATIC: "matic-network",
  AVAX: "avalanche-2",
};

// === Gauna balansus iš visų tinklų vienu metu
export async function fetchBalancesForAllChains(walletList = [], userId) {
  const prices = await fetchPrices();
  const balances = {};

  await Promise.all(
    walletList.map(async (wallet) => {
      const { network, address } = wallet;
      const rpc = rpcURLs[network?.toUpperCase()];
      if (!rpc || !address) return;

      try {
        const provider = new ethers.providers.JsonRpcProvider(rpc);
        const balance = await provider.getBalance(address);
        const formatted = parseFloat(ethers.utils.formatEther(balance));
        const symbol = network.toUpperCase();
        const price = prices[priceSymbols[symbol]] || 0;

        balances[symbol] = {
          address,
          amount: formatted.toFixed(5),
          eur: (formatted * price).toFixed(2),
        };

        // === Supabase upsert
        if (userId) {
          await supabase.from("balances").upsert(
            [
              {
                user_id: userId,
                wallet_address: address,
                network: symbol,
                amount: formatted.toFixed(5),
                eur: (formatted * price).toFixed(2),
              },
            ],
            { onConflict: ["user_id", "wallet_address", "network"] }
          );
        }
      } catch (err) {
        console.warn(`⚠️ Failed to fetch ${network} balance:`, err);
        balances[network.toUpperCase()] = {
          address,
          amount: "0.00000",
          eur: "0.00",
        };
      }
    })
  );

  return balances;
}

// === Gauna kainas iš CoinGecko
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
  } catch {
    return {};
  }
}

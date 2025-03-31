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

// === Gauk visų tinklų balansus vienu metu
export async function fetchBalancesForAllChains(walletList = [], userId) {
  const prices = await fetchPrices();
  const balances = {};

  await Promise.all(
    walletList.map(async (wallet) => {
      try {
        const symbol = wallet.network?.toUpperCase();
        const rpc = rpcURLs[symbol];
        const address = wallet.address;

        if (!rpc || !address || !symbol) return;

        const provider = new ethers.providers.JsonRpcProvider(rpc);
        const raw = await provider.getBalance(address);
        const formatted = parseFloat(ethers.utils.formatEther(raw));
        const eurPrice = prices[priceSymbols[symbol]] || 0;

        const amount = formatted.toFixed(5);
        const eur = (formatted * eurPrice).toFixed(2);

        balances[symbol] = { address, amount, eur };

        // Supabase upsert
        if (userId) {
          await supabase.from("balances").upsert(
            [{
              user_id: userId,
              wallet_address: address,
              network: symbol,
              amount,
              eur,
            }],
            { onConflict: ["user_id", "wallet_address", "network"] }
          );
        }
      } catch (err) {
        const fallbackSymbol = wallet.network?.toUpperCase();
        balances[fallbackSymbol] = {
          address: wallet.address,
          amount: "0.00000",
          eur: "0.00",
        };
        console.warn(`❌ Balance fetch failed for ${wallet.network}:`, err.message);
      }
    })
  );

  return balances;
}

// === Kainos iš CoinGecko
async function fetchPrices() {
  try {
    const ids = Object.values(priceSymbols).join(",");
    const res = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=eur`);
    const data = await res.json();

    return Object.values(priceSymbols).reduce((acc, key) => {
      acc[key] = data[key]?.eur || 0;
      return acc;
    }, {});
  } catch (err) {
    console.error("❌ CoinGecko price fetch failed:", err.message);
    return {};
  }
}

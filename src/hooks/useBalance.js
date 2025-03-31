"use client";

import { useEffect, useRef, useState } from "react";
import { useMagicLink } from "@/contexts/MagicLinkContext";
import { getWalletBalance } from "@/lib/ethers";
import { supabase } from "@/lib/supabase";

const priceSymbols = {
  BNB: "binancecoin",
  TBNB: "binancecoin",
  ETH: "ethereum",
  MATIC: "matic-network",
  AVAX: "avalanche-2",
};

const fetchPrices = async () => {
  try {
    const ids = Object.values(priceSymbols).join(",");
    const res = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=eur`);
    const data = await res.json();

    return Object.entries(priceSymbols).reduce((acc, [symbol, id]) => {
      acc[symbol] = data?.[id]?.eur || 0;
      return acc;
    }, {});
  } catch (e) {
    console.error("❌ Price fetch failed:", e.message);
    return {};
  }
};

export const useBalance = () => {
  const { wallet, user } = useMagicLink();

  const [balances, setBalances] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const isFetching = useRef(false);

  const refresh = async () => {
    if (!wallet?.list || !user?.id || isFetching.current) return;

    isFetching.current = true;
    setIsLoading(true);

    try {
      const prices = await fetchPrices();
      const results = {};

      await Promise.all(
        wallet.list.map(async ({ network, address }) => {
          const { formatted } = await getWalletBalance(address, network.toLowerCase());
          const eur = (parseFloat(formatted) * prices[network] || 0).toFixed(2);
          results[network] = {
            address,
            amount: formatted,
            eur,
          };

          // Upsert į supabase (nebūtina – optional)
          await supabase.from("balances").upsert([{
            user_id: user.id,
            wallet_address: address,
            network,
            amount: formatted,
            eur,
          }], {
            onConflict: ["user_id", "wallet_address", "network"],
          });
        })
      );

      // Total EUR
      const total = Object.values(results).reduce((sum, b) => sum + parseFloat(b.eur), 0);
      results.totalEUR = total.toFixed(2);

      setBalances(results);
    } catch (err) {
      console.error("❌ Failed to fetch balances:", err.message);
    } finally {
      setIsLoading(false);
      isFetching.current = false;
    }
  };

  useEffect(() => {
    if (wallet?.list?.length && user?.id) {
      refresh();
      const interval = setInterval(refresh, 20000); // 20s refresh
      return () => clearInterval(interval);
    }
  }, [wallet, user]);

  return { balances, isLoading, refresh };
};

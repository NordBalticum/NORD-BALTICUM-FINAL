"use client";

import { useEffect, useRef, useState, useCallback } from "react";
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
    const res = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=eur`
    );
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
  const controller = useRef(null);

  const refresh = useCallback(async () => {
    if (!wallet?.list || !user?.id || isFetching.current) return;

    isFetching.current = true;
    setIsLoading(true);
    controller.current?.abort();
    controller.current = new AbortController();

    try {
      const prices = await fetchPrices();
      const results = {};

      await Promise.all(
        wallet.list.map(async ({ network, address }) => {
          try {
            const lowerNet = network.toLowerCase();
            const { formatted } = await getWalletBalance(address, lowerNet);

            const price = prices?.[network] || 0;
            const eur = (parseFloat(formatted) * price).toFixed(2);

            results[network] = {
              address,
              amount: formatted,
              eur: isNaN(eur) ? "0.00" : eur,
            };

            await supabase.from("balances").upsert(
              [
                {
                  user_id: user.id,
                  wallet_address: address,
                  network,
                  amount: formatted,
                  eur,
                  updated_at: new Date().toISOString(),
                },
              ],
              {
                onConflict: ["user_id", "wallet_address", "network"],
              }
            );
          } catch (err) {
            console.warn(`❌ Balance error [${network}]:`, err.message);
            results[network] = {
              address,
              amount: "0.00000",
              eur: "0.00",
            };
          }
        })
      );

      const total = Object.values(results).reduce((sum, b) => {
        const val = parseFloat(b.eur);
        return sum + (isNaN(val) ? 0 : val);
      }, 0);

      results.totalEUR = total.toFixed(2);
      setBalances(results);
    } catch (err) {
      console.error("❌ Failed to refresh balances:", err.message);
    } finally {
      setIsLoading(false);
      isFetching.current = false;
    }
  }, [wallet, user]);

  useEffect(() => {
    if (wallet?.list?.length && user?.id) {
      refresh();
      const interval = setInterval(refresh, 30000);
      return () => clearInterval(interval);
    }
  }, [wallet, user, refresh]);

  return { balances, isLoading, refresh };
};

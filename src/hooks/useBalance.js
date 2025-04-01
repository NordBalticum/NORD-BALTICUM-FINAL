"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useMagicLink } from "@/contexts/MagicLinkContext";
import { getWalletBalance } from "@/lib/ethers";
import { supabase } from "@/lib/supabase";

// Mape susiejame kripto simbolius su jų Coingecko ID
const priceSymbols = {
  BNB: "binancecoin",
  TBNB: "binancecoin",
  ETH: "ethereum",
  MATIC: "matic-network",
  AVAX: "avalanche-2",
};

// Kainų paėmimas iš CoinGecko API
const fetchPrices = async () => {
  try {
    const ids = Object.values(priceSymbols).join(",");
    const res = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=eur`
    );
    const data = await res.json();

    return Object.entries(priceSymbols).reduce((acc, [symbol, id]) => {
      acc[symbol] = data?.[id]?.eur || 0; // Jei kaina negaunama, priskiriame 0
      return acc;
    }, {});
  } catch (e) {
    console.error("❌ Price fetch failed:", e.message);
    return {};
  }
};

// Custom hookas balansų paėmimui
export const useBalance = () => {
  const { wallet, user } = useMagicLink(); // Pasiimame informaciją apie wallet ir user
  const [balances, setBalances] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const isFetching = useRef(false); // Norint patikrinti, ar jau nevykdoma užklausa
  const controller = useRef(null);

  // Refresh funkcija, kurios metu atnaujiname balansus
  const refresh = useCallback(async () => {
    if (!wallet?.list || !user?.id || isFetching.current) return;

    isFetching.current = true;
    setIsLoading(true);
    controller.current?.abort();
    controller.current = new AbortController();

    try {
      const prices = await fetchPrices(); // Gaukime kainas iš API
      const results = {}; // Rezultatai, kuriuos laikysime

      // Atliekame užklausas kiekvienam wallet
      await Promise.all(
        wallet.list.map(async ({ network, address }) => {
          try {
            const lowerNet = network.toLowerCase();
            const { formatted } = await getWalletBalance(address, lowerNet); // Gaukite balansą

            // Kaina ir konvertavimas į EUR
            const price = prices?.[network] || 0;
            const eur = (parseFloat(formatted) * price).toFixed(2);

            // Užpildome rezultatus
            results[network] = {
              address,
              amount: formatted,
              eur: isNaN(eur) ? "0.00" : eur,
            };

            // Sinchronizuojame balansą su Supabase duomenų baze
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
                onConflict: ["user_id", "wallet_address", "network"], // Jei jau egzistuoja - atnaujina
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

      // Apskaičiuojame bendrą EUR sumą
      const total = Object.values(results).reduce((sum, b) => {
        const val = parseFloat(b.eur);
        return sum + (isNaN(val) ? 0 : val);
      }, 0);

      // Rezultatų atnaujinimas
      results.totalEUR = total.toFixed(2);
      setBalances(results);
    } catch (err) {
      console.error("❌ Failed to refresh balances:", err.message);
    } finally {
      setIsLoading(false);
      isFetching.current = false;
    }
  }, [wallet, user]);

  // Periodiškai atnaujiname kas 30 sekundžių
  useEffect(() => {
    if (wallet?.list?.length && user?.id) {
      refresh(); // Pirmas atnaujinimas
      const interval = setInterval(refresh, 30000); // 30 sek intervalas
      return () => clearInterval(interval); // Grąžinimas su intervalų valdymu
    }
  }, [wallet, user, refresh]);

  return { balances, isLoading, refresh }; // Grąžinimas
};

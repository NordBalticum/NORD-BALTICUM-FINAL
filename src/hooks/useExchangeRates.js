"use client";

/**
 * useExchangeRates — Final MetaMask-Grade Exchange Rate Hook
 * ===========================================================
 * Automatiškai grąžina USD + EUR kainą iš CoinGecko (fallback į CoinCap).
 * Veikia su visais 36+ EVM tinklais, palaiko coingeckoId + coincapId iš networks.js.
 * Bulletproof saugumas, klaidų valdymas, pilnai deploy-ready.
 */

import { useEffect, useState } from "react";
import axios from "axios";
import { useNetworkMeta } from "./useNetworkMeta";
import { getCoinGeckoId, getCoinCapId } from "@/data/networks";

export function useExchangeRates() {
  const { chainId, isTestnet } = useNetworkMeta();

  const [priceUSD, setPriceUSD] = useState(null);
  const [priceEUR, setPriceEUR] = useState(null);
  const [loading, setLoading] = useState(false);
  const [source, setSource] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!chainId || isTestnet) return;

    let cancelled = false;

    const fetchFromCoinGecko = async (id) => {
      const url = `https://api.coingecko.com/api/v3/simple/price?ids=${id}&vs_currencies=usd,eur`;
      const { data } = await axios.get(url, { timeout: 6000 });
      return {
        usd: data?.[id]?.usd ?? null,
        eur: data?.[id]?.eur ?? null,
      };
    };

    const fetchFromCoinCap = async (id) => {
      const url = `https://api.coincap.io/v2/assets/${id}`;
      const { data } = await axios.get(url, { timeout: 6000 });
      return {
        usd: parseFloat(data?.data?.priceUsd) || null,
        eur: null, // CoinCap nesiūlo EUR
      };
    };

    const fetchPrices = async () => {
      setLoading(true);
      setError(null);

      try {
        const cgId = getCoinGeckoId(chainId);
        if (!cgId) throw new Error("Missing CoinGecko ID");

        const prices = await fetchFromCoinGecko(cgId);
        if (!cancelled) {
          setPriceUSD(prices.usd);
          setPriceEUR(prices.eur);
          setSource("coingecko");
        }
      } catch (err) {
        console.warn("⚠️ CoinGecko failed, trying CoinCap:", err.message);
        try {
          const ccId = getCoinCapId(chainId);
          if (!ccId) throw new Error("Missing CoinCap ID");

          const prices = await fetchFromCoinCap(ccId);
          if (!cancelled) {
            setPriceUSD(prices.usd);
            setPriceEUR(null);
            setSource("coincap");
          }
        } catch (err2) {
          console.error("❌ Exchange rate fetch failed:", err2.message);
          if (!cancelled) {
            setPriceUSD(null);
            setPriceEUR(null);
            setSource(null);
            setError(err2.message || "Rate fetch failed");
          }
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchPrices();
    return () => {
      cancelled = true;
    };
  }, [chainId, isTestnet]);

  return {
    priceUSD,      // number | null
    priceEUR,      // number | null
    source,        // "coingecko" | "coincap" | null
    loading,       // boolean
    error,         // string | null
  };
}

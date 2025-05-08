// src/hooks/useExchangeRates.js
"use client";

/**
 * useExchangeRates — Final MetaMask-Grade Exchange Rate Hook
 * ===========================================================
 * Automatiškai grąžina USD + EUR kainą iš CoinGecko (fallback į CoinCap).
 * Veikia su visais EVM tinklais, palaiko coingeckoId + coincapId iš networks.js.
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
  const [source, setSource] = useState("coingecko"); // arba "coincap"
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!chainId || isTestnet) return;

    const fetchFromCoinGecko = async (id) => {
      const url = `https://api.coingecko.com/api/v3/simple/price?ids=${id}&vs_currencies=usd,eur`;
      const { data } = await axios.get(url);
      return {
        usd: data?.[id]?.usd || null,
        eur: data?.[id]?.eur || null,
      };
    };

    const fetchFromCoinCap = async (id) => {
      const url = `https://api.coincap.io/v2/assets/${id}`;
      const { data } = await axios.get(url);
      return {
        usd: parseFloat(data?.data?.priceUsd) || null,
        eur: null, // CoinCap neteikia EUR
      };
    };

    const fetchPrices = async () => {
      setLoading(true);
      setError(null);

      try {
        const id = getCoinGeckoId(chainId);
        if (!id) throw new Error("Missing CoinGecko ID");
        const prices = await fetchFromCoinGecko(id);
        setPriceUSD(prices.usd);
        setPriceEUR(prices.eur);
        setSource("coingecko");
      } catch (err) {
        console.warn("⚠️ CoinGecko failed, trying CoinCap…", err.message);
        try {
          const id = getCoinCapId(chainId);
          if (!id) throw new Error("Missing CoinCap ID");
          const prices = await fetchFromCoinCap(id);
          setPriceUSD(prices.usd);
          setPriceEUR(null);
          setSource("coincap");
        } catch (err2) {
          console.error("❌ Exchange rate fetch failed:", err2.message);
          setPriceUSD(null);
          setPriceEUR(null);
          setSource(null);
          setError(err2.message);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchPrices();
  }, [chainId, isTestnet]);

  return {
    priceUSD,
    priceEUR,
    loading,
    error,
    source,
  };
}

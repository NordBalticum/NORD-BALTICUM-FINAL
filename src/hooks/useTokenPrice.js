// src/hooks/useTokenPrice.js
"use client";

/**
 * useTokenPrice — MetaMask-Grade v2.0
 * ===================================
 * Universalus native ir ERC20 token kainos USD hook’as.
 * Grąžina tikslią USD kainą iš CoinGecko.
 * Automatinis fallback ir loading/error tvarkymas.
 */

import { useEffect, useState } from "react";
import axios from "axios";
import { useNetworkMeta } from "./useNetworkMeta";
import { getCoinGeckoId } from "@/data/networks";

export function useTokenPrice(tokenType = "native") {
  const { chainId, tokenAddress, isTestnet } = useNetworkMeta();
  const [priceUSD, setPriceUSD] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!chainId || isTestnet) return;

    const fetchPrice = async () => {
      setLoading(true);
      setError(null);

      try {
        let url = "";
        if (tokenType === "native") {
          const id = getCoinGeckoId(chainId);
          if (!id) throw new Error("No CoinGecko ID for chain");
          url = `https://api.coingecko.com/api/v3/simple/price?ids=${id}&vs_currencies=usd`;
        } else if (tokenAddress) {
          url = `https://api.coingecko.com/api/v3/simple/token_price/ethereum?contract_addresses=${tokenAddress}&vs_currencies=usd`;
        } else {
          throw new Error("Missing token address");
        }

        const { data } = await axios.get(url);

        if (tokenType === "native") {
          const id = getCoinGeckoId(chainId);
          const value = data?.[id]?.usd;
          if (value) setPriceUSD(value);
          else throw new Error("Price not found");
        } else {
          const key = Object.keys(data)[0];
          const value = data?.[key]?.usd;
          if (value) setPriceUSD(value);
          else throw new Error("Token price not found");
        }
      } catch (err) {
        console.warn("❌ useTokenPrice error:", err.message);
        setPriceUSD(null);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchPrice();
  }, [chainId, tokenAddress, tokenType, isTestnet]);

  return { priceUSD, loading, error };
}

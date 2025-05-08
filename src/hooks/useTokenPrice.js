// src/hooks/useTokenPrice.js
"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { useNetworkMeta } from "./useNetworkMeta";

export function useTokenPrice(tokenType = "native") {
  const { chainId, tokenAddress } = useNetworkMeta();
  const [priceUSD, setPriceUSD] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPrice = async () => {
      setLoading(true);
      try {
        let url = "";

        if (tokenType === "native") {
          url = `https://api.coingecko.com/api/v3/simple/token_price/ethereum?contract_addresses=0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee&vs_currencies=usd`;
        } else if (tokenAddress) {
          url = `https://api.coingecko.com/api/v3/simple/token_price/ethereum?contract_addresses=${tokenAddress}&vs_currencies=usd`;
        }

        const { data } = await axios.get(url);
        const key = Object.keys(data)[0];
        setPriceUSD(data?.[key]?.usd || null);
      } catch (err) {
        console.warn("❌ Token price fetch failed:", err.message);
        setPriceUSD(null);
      } finally {
        setLoading(false);
      }
    };

    if (chainId) fetchPrice();
  }, [chainId, tokenAddress, tokenType]);

  return { priceUSD, loading };
}

// src/hooks/useTokenHolders.js
"use client";

// Šis hook'as naudoja `explorerApi` (pvz. Etherscan, BscScan, etc.) norint gauti holderių skaičių.
// Reikalinga, kad `networks.js` turėtų `explorerApi` ir kad būtų API key aplinkoje.

import { useEffect, useState } from "react";
import networks from "@/utils/networks";
import { getTokenHolders } from "@/utils/fetchTokenHolders"; // reikia sukurti utils/fetchTokenHolders.js

export function useTokenHolders(chainId, tokenAddress) {
  const [holders, setHolders] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      setError(null);

      try {
        const data = await getTokenHolders(chainId, tokenAddress);
        setHolders(data);
      } catch (err) {
        console.warn("❌ Token holders fetch error:", err.message);
        setError(err.message);
        setHolders(null);
      } finally {
        setLoading(false);
      }
    };

    if (tokenAddress && chainId) fetch();
  }, [chainId, tokenAddress]);

  return { holders, loading, error };
}

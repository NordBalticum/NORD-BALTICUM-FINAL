"use client";

import { useEffect, useState } from "react";
import { isAddress } from "ethers";
import networks from "@/data/networks";
import { getTokenHolders } from "@/utils/fetchTokenHolders";

export function useTokenHolders(chainId, tokenAddress) {
  const [holders, setHolders] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    const fetch = async () => {
      setLoading(true);
      setError(null);

      try {
        if (!chainId || !isAddress(tokenAddress)) {
          throw new Error("Invalid chainId or tokenAddress");
        }

        const network = networks.find(
          (n) => n.chainId === chainId || n.testnet?.chainId === chainId
        );

        if (!network?.explorerApi) {
          throw new Error("Missing explorer API for selected network");
        }

        const result = await getTokenHolders(chainId, tokenAddress);
        if (!cancelled) setHolders(result);
      } catch (err) {
        console.warn("❌ Token holders fetch error:", err.message);
        if (!cancelled) {
          setError(err.message);
          setHolders(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    if (chainId && tokenAddress) fetch();
    return () => {
      cancelled = true;
    };
  }, [chainId, tokenAddress]);

  return { holders, loading, error };
}

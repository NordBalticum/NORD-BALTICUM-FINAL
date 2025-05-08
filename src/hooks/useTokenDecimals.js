"use client";

/**
 * useTokenDecimals — Final MetaMask-Grade v2.0
 * ============================================
 * Gauk ERC20 tokeno `decimals` saugiai, greitai, ir universaliai.
 */

import { useEffect, useState } from "react";
import { ethers } from "ethers";
import ERC20ABI from "@/abi/ERC20.json";
import { getProviderForChain } from "@/utils/getProviderForChain";

export function useTokenDecimals(chainId, tokenAddress) {
  const [decimals, setDecimals] = useState(18); // default fallback
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    const fetch = async () => {
      setLoading(true);
      setError(null);

      try {
        if (!chainId || !ethers.isAddress(tokenAddress)) {
          throw new Error("Invalid or missing token address");
        }

        const provider = getProviderForChain(chainId);
        const contract = new ethers.Contract(tokenAddress, ERC20ABI, provider);

        const result = await contract.decimals();
        const parsed = Number(result?.toString?.() || "18");

        if (!cancelled && !isNaN(parsed)) {
          setDecimals(parsed);
        }
      } catch (err) {
        console.warn("❌ useTokenDecimals error:", err.message);
        if (!cancelled) {
          setDecimals(18);
          setError(err.message);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    if (tokenAddress && chainId) fetch();

    return () => {
      cancelled = true;
    };
  }, [chainId, tokenAddress]);

  return { decimals, loading, error };
}

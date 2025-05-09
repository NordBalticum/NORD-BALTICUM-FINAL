"use client";

/**
 * useTokenSupply — Final MetaMask-Grade Hook
 * ==========================================
 * Returns formatted totalSupply from ERC20 contract.
 * Fallback to 18 decimals, safe even with imperfect contracts.
 */

import { useEffect, useState } from "react";
import { ethers } from "ethers";
import { getProviderForChain } from "@/utils/getProviderForChain";
import ERC20ABI from "@/abi/ERC20.json"; // or "@/utils/erc20ABI" for minimal ABI

export function useTokenSupply(chainId, tokenAddress) {
  const [supply, setSupply] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    const fetchSupply = async () => {
      if (!chainId || !tokenAddress) return;

      setLoading(true);
      setError(null);

      try {
        const provider = getProviderForChain(chainId);
        const contract = new ethers.Contract(tokenAddress, ERC20ABI, provider);

        const [rawSupply, decimals] = await Promise.all([
          contract.totalSupply(),
          contract.decimals().catch(() => 18),
        ]);

        if (!cancelled) {
          const formatted = ethers.formatUnits(rawSupply, decimals);
          setSupply(formatted);
        }
      } catch (err) {
        console.warn("❌ useTokenSupply error:", err.message);
        if (!cancelled) {
          setError(err.message);
          setSupply(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchSupply();
    return () => {
      cancelled = true;
    };
  }, [chainId, tokenAddress]);

  return {
    supply,
    loading,
    error,
  };
}

// src/hooks/useTokenName.js
"use client";

/**
 * useTokenName — MetaMask-grade ERC20 name hook
 * =============================================
 * Gauna tokeno pavadinimą saugiai iš bet kurio EVM tinklo.
 * Jei nepavyksta – grąžina null be crash'ų.
 */

import { useEffect, useState } from "react";
import { ethers } from "ethers";
import ERC20ABI from "@/abi/ERC20.json";
import { getProviderForChain } from "@/utils/getProviderForChain";

export function useTokenName(chainId, tokenAddress) {
  const [name, setName] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    const fetchName = async () => {
      if (!chainId || !tokenAddress) return;

      setLoading(true);
      setError(null);

      try {
        const provider = getProviderForChain(chainId);
        const contract = new ethers.Contract(tokenAddress, ERC20ABI, provider);
        const result = await contract.name();
        if (!cancelled) setName(result);
      } catch (err) {
        console.warn("❌ useTokenName error:", err.message);
        if (!cancelled) {
          setName(null);
          setError(err.message || "Failed to fetch token name");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchName();
    return () => {
      cancelled = true;
    };
  }, [chainId, tokenAddress]);

  return { name, loading, error };
}

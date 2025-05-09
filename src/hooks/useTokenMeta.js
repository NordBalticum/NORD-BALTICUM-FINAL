"use client";

/**
 * useTokenMeta — MetaMask-grade ERC20 token metadata hook
 * ========================================================
 * Returns the symbol, name, decimals (with SSR protection and fallback).
 * Fully functional on all EVM networks, filters errors, works with non-compliant contracts.
 */

import { useEffect, useState } from "react";
import { ethers } from "ethers";
import ERC20ABI from "@/abi/ERC20.json";
import { getProviderForChain } from "@/utils/getProviderForChain";

export function useTokenMeta(chainId, tokenAddress) {
  const [meta, setMeta] = useState({
    name: null,
    symbol: null,
    decimals: 18,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    const fetchMeta = async () => {
      if (!chainId || !tokenAddress) return;

      setLoading(true);
      setError(null);

      try {
        const provider = getProviderForChain(chainId);
        const contract = new ethers.Contract(tokenAddress, ERC20ABI, provider);

        const [name, symbol, decimals] = await Promise.all([
          contract.name().catch(() => null),
          contract.symbol().catch(() => null),
          contract.decimals().catch(() => 18),
        ]);

        if (!cancelled) {
          setMeta({
            name: name || "Unknown",            // Default fallback to "Unknown"
            symbol: symbol || "???",            // Default fallback to "???"
            decimals: decimals ?? 18,           // Default fallback to 18 decimals
          });
        }
      } catch (err) {
        console.warn("❌ useTokenMeta error:", err.message);
        if (!cancelled) {
          setError(err.message || "Token metadata error");
          setMeta({ name: "Unknown", symbol: "???", decimals: 18 });  // Set defaults on error
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchMeta();
    return () => {
      cancelled = true;
    };
  }, [chainId, tokenAddress]);

  return {
    ...meta,       // Return the token's name, symbol, decimals
    loading,       // Loading state for metadata
    error,         // Error state for any issues during metadata fetch
  };
}

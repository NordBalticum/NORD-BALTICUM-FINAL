"use client";

/**
 * useERC20Meta — MetaMask-grade ERC20 metaduomenų hookas
 * ======================================================
 * Grąžina pavadinimą, simbolį ir desimalus bet kuriam EVM tinklui.
 * • Tikrina provider'į, address'ą
 * • Veikia su bet kuriuo iš 36+ tinklų
 * • 100% bulletproof su fallback ir klaidų valdymu
 */

import { useEffect, useState } from "react";
import { ethers } from "ethers";
import { getProviderForChain } from "@/utils/getProviderForChain";

const MINIMAL_ERC20_ABI = [
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
];

export function useERC20Meta(tokenAddress, chainId) {
  const [name, setName] = useState(null);
  const [symbol, setSymbol] = useState(null);
  const [decimals, setDecimals] = useState(18);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!tokenAddress || !ethers.isAddress(tokenAddress) || !chainId) return;

    let cancelled = false;

    const fetchMetadata = async () => {
      setLoading(true);
      setError(null);

      try {
        const provider = getProviderForChain(chainId);
        if (!provider) throw new Error("Provider unavailable");

        const contract = new ethers.Contract(tokenAddress, MINIMAL_ERC20_ABI, provider);

        const [fetchedName, fetchedSymbol, fetchedDecimals] = await Promise.all([
          contract.name().catch(() => null),
          contract.symbol().catch(() => null),
          contract.decimals().catch(() => 18),
        ]);

        if (!cancelled) {
          setName(fetchedName || "Unknown");
          setSymbol(fetchedSymbol || "???");
          setDecimals(fetchedDecimals ?? 18);
        }
      } catch (err) {
        console.warn("❌ useERC20Meta error:", err.message);
        if (!cancelled) {
          setError(err.message || "Failed to fetch token metadata");
          setName("Unknown");
          setSymbol("???");
          setDecimals(18);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchMetadata();
    return () => {
      cancelled = true;
    };
  }, [tokenAddress, chainId]);

  return {
    name,
    symbol,
    decimals,
    loading,
    error,
  };
}

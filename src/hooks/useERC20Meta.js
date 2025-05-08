"use client";

import { useEffect, useState } from "react";
import { ethers } from "ethers";
import { getProviderForChain } from "@/utils/getProviderForChain";

const ERC20_ABI = [
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
];

/**
 * useERC20Meta – universalus hookas token metaduomenims gauti
 *
 * @param {string} tokenAddress – ERC20 tokeno adresas
 * @param {number} chainId – tinklo ID
 * @returns { name, symbol, decimals, loading, error }
 */
export function useERC20Meta(tokenAddress, chainId) {
  const [meta, setMeta] = useState({ name: "", symbol: "", decimals: 18 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!tokenAddress || !chainId) return;

    const fetchMeta = async () => {
      setLoading(true);
      setError(null);

      try {
        const provider = getProviderForChain(chainId);
        if (!provider) throw new Error("Provider unavailable");

        const contract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);

        const [name, symbol, decimals] = await Promise.all([
          contract.name(),
          contract.symbol(),
          contract.decimals(),
        ]);

        setMeta({ name, symbol, decimals });
      } catch (err) {
        console.warn("❌ useERC20Meta error:", err.message);
        setMeta({ name: "", symbol: "", decimals: 18 });
        setError(err.message || "Failed to load token metadata");
      } finally {
        setLoading(false);
      }
    };

    fetchMeta();
  }, [tokenAddress, chainId]);

  return {
    name: meta.name,
    symbol: meta.symbol,
    decimals: meta.decimals,
    loading,
    error,
  };
}

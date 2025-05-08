// src/hooks/useERC20Meta.js
"use client";

import { useEffect, useState } from "react";
import { getProviderForChain } from "@/utils/getProviderForChain";
import { ethers } from "ethers";

const ERC20_ABI = [
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
];

export function useERC20Meta(tokenAddress, chainId) {
  const [meta, setMeta] = useState({
    name: null,
    symbol: null,
    decimals: null,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!tokenAddress || !chainId) return;

    const fetchMeta = async () => {
      setLoading(true);
      setError(null);
      try {
        const provider = getProviderForChain(chainId);
        const contract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);

        const [name, symbol, decimals] = await Promise.all([
          contract.name(),
          contract.symbol(),
          contract.decimals(),
        ]);

        setMeta({ name, symbol, decimals });
      } catch (err) {
        setError(err.message || "Failed to load ERC20 meta");
      } finally {
        setLoading(false);
      }
    };

    fetchMeta();
  }, [tokenAddress, chainId]);

  return { ...meta, loading, error };
}

// src/hooks/useTokenName.js
"use client";

/**
 * useTokenName — ERC20 name() gavimas su MetaMask-grade stabilumu
 * ---------------------------------------------------------------
 * Naudoja minimalų inline ABI. Jokio konflikto su bendru ABI rinkiniu.
 */

import { useEffect, useState } from "react";
import { ethers } from "ethers";
import { getProviderForChain } from "@/utils/getProviderForChain";

const NAME_ABI = ["function name() view returns (string)"];

export function useTokenName(chainId, tokenAddress) {
  const [name, setName] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    const fetch = async () => {
      if (!chainId || !tokenAddress) return;

      setLoading(true);
      setError(null);

      try {
        const provider = getProviderForChain(chainId);
        const contract = new ethers.Contract(tokenAddress, NAME_ABI, provider);
        const result = await contract.name();
        if (!cancelled) setName(result);
      } catch (err) {
        console.warn("❌ useTokenName error:", err.message);
        if (!cancelled) {
          setName(null);
          setError(err.message);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetch();
    return () => {
      cancelled = true;
    };
  }, [chainId, tokenAddress]);

  return { name, loading, error };
}

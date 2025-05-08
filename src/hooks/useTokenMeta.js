// src/hooks/useTokenMeta.js
"use client";

import { useEffect, useState } from "react";
import { ethers } from "ethers";
import ERC20ABI from "@/abi/ERC20.json";
import { getProviderForChain } from "@/utils/getProviderForChain";

export function useTokenMeta(chainId, tokenAddress) {
  const [meta, setMeta] = useState({ name: "", symbol: "", decimals: 18 });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!chainId || !tokenAddress) return;

    const fetchMeta = async () => {
      setLoading(true);
      try {
        const provider = getProviderForChain(chainId);
        const contract = new ethers.Contract(tokenAddress, ERC20ABI, provider);
        const [name, symbol, decimals] = await Promise.all([
          contract.name(),
          contract.symbol(),
          contract.decimals(),
        ]);
        setMeta({ name, symbol, decimals });
      } catch (err) {
        console.warn("⚠️ useTokenMeta error:", err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchMeta();
  }, [chainId, tokenAddress]);

  return { ...meta, loading };
}

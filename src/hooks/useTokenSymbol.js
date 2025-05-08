// src/hooks/useTokenSymbol.js
"use client";

import { useEffect, useState } from "react";
import { ethers } from "ethers";
import ERC20ABI from "@/abi/ERC20.json";
import { getProviderForChain } from "@/utils/getProviderForChain";

export function useTokenSymbol(chainId, tokenAddress) {
  const [symbol, setSymbol] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const provider = getProviderForChain(chainId);
        const contract = new ethers.Contract(tokenAddress, ERC20ABI, provider);
        const result = await contract.symbol();
        setSymbol(result);
      } catch (err) {
        console.warn("❌ Fetch symbol failed:", err.message);
        setSymbol(null);
      } finally {
        setLoading(false);
      }
    };

    if (tokenAddress && chainId) fetch();
  }, [chainId, tokenAddress]);

  return { symbol, loading };
}

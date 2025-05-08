// src/hooks/useTokenDecimals.js
"use client";

import { useEffect, useState } from "react";
import { ethers } from "ethers";
import ERC20ABI from "@/abi/ERC20.json";
import { getProviderForChain } from "@/utils/getProviderForChain";

export function useTokenDecimals(chainId, tokenAddress) {
  const [decimals, setDecimals] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const provider = getProviderForChain(chainId);
        const contract = new ethers.Contract(tokenAddress, ERC20ABI, provider);
        const result = await contract.decimals();
        setDecimals(result);
      } catch (err) {
        console.warn("❌ Fetch decimals failed:", err.message);
        setDecimals(null);
      } finally {
        setLoading(false);
      }
    };

    if (tokenAddress && chainId) fetch();
  }, [chainId, tokenAddress]);

  return { decimals, loading };
}

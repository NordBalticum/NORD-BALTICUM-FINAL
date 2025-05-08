// src/hooks/useTokenSupply.js
"use client";

import { useEffect, useState } from "react";
import { ethers } from "ethers";
import ERC20ABI from "@/abi/ERC20.json";
import { getProviderForChain } from "@/utils/getProviderForChain";

export function useTokenSupply(chainId, tokenAddress) {
  const [supply, setSupply] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const provider = getProviderForChain(chainId);
        const contract = new ethers.Contract(tokenAddress, ERC20ABI, provider);
        const result = await contract.totalSupply();
        const decimals = await contract.decimals();
        setSupply(ethers.formatUnits(result, decimals));
      } catch (err) {
        console.warn("❌ Total supply fetch error:", err.message);
        setSupply(null);
      } finally {
        setLoading(false);
      }
    };

    if (tokenAddress && chainId) fetch();
  }, [chainId, tokenAddress]);

  return { supply, loading };
}

// src/hooks/useTokenAllowance.js
"use client";

import { useEffect, useState } from "react";
import { ethers } from "ethers";
import ERC20ABI from "@/abi/ERC20.json";
import { getProviderForChain } from "@/utils/getProviderForChain";
import { useAuth } from "@/contexts/AuthContext";

export function useTokenAllowance(chainId, tokenAddress, spenderAddress) {
  const { getPrimaryAddress } = useAuth();
  const [allowance, setAllowance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetch = async () => {
      if (!chainId || !tokenAddress || !spenderAddress) return;

      const owner = getPrimaryAddress();
      if (!owner) return;

      setLoading(true);
      setError(null);

      try {
        const provider = getProviderForChain(chainId);
        const contract = new ethers.Contract(tokenAddress, ERC20ABI, provider);
        const raw = await contract.allowance(owner, spenderAddress);
        const decimals = await contract.decimals();
        setAllowance(ethers.formatUnits(raw, decimals));
      } catch (err) {
        console.warn("❌ useTokenAllowance error:", err.message);
        setError(err.message);
        setAllowance(null);
      } finally {
        setLoading(false);
      }
    };

    fetch();
  }, [chainId, tokenAddress, spenderAddress, getPrimaryAddress]);

  return { allowance, loading, error };
}

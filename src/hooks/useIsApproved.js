// src/hooks/useIsApproved.js
"use client";

import { useMemo } from "react";
import { ethers } from "ethers";
import { useTokenAllowance } from "./useTokenAllowance";

export function useIsApproved(chainId, tokenAddress, userAddress, requiredAmount) {
  const { allowance, loading, error } = useTokenAllowance(chainId, tokenAddress, userAddress);

  const isApproved = useMemo(() => {
    if (!requiredAmount || !allowance) return false;
    try {
      const required = ethers.parseUnits(requiredAmount.toString(), 18); // default 18
      return allowance >= required;
    } catch {
      return false;
    }
  }, [allowance, requiredAmount]);

  return { isApproved, loading, error };
}

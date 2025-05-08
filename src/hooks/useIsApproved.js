"use client";

/**
 * useIsApproved — Tikrina ar allowance pakanka siųsti norimą kiekį
 * ================================================================
 * - Naudoja useTokenAllowance hooką
 * - Automatiškai atsižvelgia į tokeno decimals (jei galima)
 * - Atsparus null / zero allowance
 * - Naudoja BigInt palyginimus vietoj Number
 */

import { useMemo, useEffect, useState } from "react";
import { ethers } from "ethers";
import { useTokenAllowance } from "./useTokenAllowance";
import ERC20ABI from "@/abi/ERC20.json";
import { getProviderForChain } from "@/utils/getProviderForChain";

export function useIsApproved(chainId, tokenAddress, userAddress, requiredAmount) {
  const { allowance, loading: allowanceLoading, error } = useTokenAllowance(
    chainId,
    tokenAddress,
    userAddress
  );

  const [decimals, setDecimals] = useState(18); // default fallback
  const [decimalsLoading, setDecimalsLoading] = useState(true);

  useEffect(() => {
    if (!chainId || !tokenAddress) return;

    const fetchDecimals = async () => {
      try {
        const provider = getProviderForChain(chainId);
        const contract = new ethers.Contract(tokenAddress, ERC20ABI, provider);
        const d = await contract.decimals();
        setDecimals(Number(d));
      } catch (err) {
        console.warn("⚠️ useIsApproved: failed to fetch decimals, defaulting to 18");
        setDecimals(18);
      } finally {
        setDecimalsLoading(false);
      }
    };

    fetchDecimals();
  }, [chainId, tokenAddress]);

  const isApproved = useMemo(() => {
    if (
      allowance == null ||
      requiredAmount == null ||
      decimalsLoading ||
      allowanceLoading
    )
      return false;

    try {
      const required = ethers.parseUnits(requiredAmount.toString(), decimals);
      return BigInt(allowance) >= BigInt(required);
    } catch (err) {
      console.warn("❌ useIsApproved parse error:", err.message);
      return false;
    }
  }, [allowance, requiredAmount, decimals, decimalsLoading, allowanceLoading]);

  return {
    isApproved,
    loading: allowanceLoading || decimalsLoading,
    error,
  };
}

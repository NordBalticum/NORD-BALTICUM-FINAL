"use client";

/**
 * useIsApproved — Final MetaMask-Grade Token Approval Checker
 * ============================================================
 * Patikrina ar naudotojas turi pakankamą allowance norimam kiekio siuntimui.
 * - Naudoja useTokenAllowance hook'ą
 * - Automatiškai gauna token decimals iš kontrakto (su fallback)
 * - Atspari null, 0, ar decimal error'ams
 * - Naudoja BigInt palyginimą (tikslus)
 */

import { useMemo, useEffect, useState } from "react";
import { ethers } from "ethers";
import { useTokenAllowance } from "./useTokenAllowance";
import ERC20ABI from "@/abi/ERC20.json";
import { getProviderForChain } from "@/utils/getProviderForChain";

export function useIsApproved(chainId, tokenAddress, userAddress, requiredAmount) {
  const {
    allowance,
    loading: allowanceLoading,
    error: allowanceError,
  } = useTokenAllowance(chainId, tokenAddress, userAddress);

  const [decimals, setDecimals] = useState(18); // Fallback if decimals fail
  const [decimalsLoading, setDecimalsLoading] = useState(true);
  const [decimalsError, setDecimalsError] = useState(null);

  useEffect(() => {
    if (!chainId || !ethers.isAddress(tokenAddress)) return;

    const fetchDecimals = async () => {
      setDecimalsLoading(true);
      setDecimalsError(null);

      try {
        const provider = getProviderForChain(chainId);
        const contract = new ethers.Contract(tokenAddress, ERC20ABI, provider);
        const d = await contract.decimals();
        setDecimals(Number(d));
      } catch (err) {
        console.warn("⚠️ useIsApproved: decimals fetch failed, fallback to 18");
        setDecimals(18);
        setDecimalsError(err.message || "Failed to fetch decimals");
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
    ) {
      return false;
    }

    try {
      const required = ethers.parseUnits(requiredAmount.toString(), decimals);
      return BigInt(allowance) >= BigInt(required);
    } catch (err) {
      console.warn("❌ useIsApproved parse error:", err.message);
      return false;
    }
  }, [allowance, requiredAmount, decimals, decimalsLoading, allowanceLoading]);

  return {
    isApproved,                                      // boolean: true jei allowance užtenka
    loading: allowanceLoading || decimalsLoading,    // boolean: true kol tikrinama
    error: allowanceError || decimalsError || null,  // string|null
  };
}

"use client";

import { useEffect, useState, useMemo } from "react";
import { ethers } from "ethers";
import { useAuth } from "@/contexts/AuthContext";
import { useNetwork } from "@/contexts/NetworkContext";
import { getProviderForChain } from "@/utils/getProviderForChain";
import { getAdminAddressByChainId } from "@/utils/networks";
import ERC20ABI from "@/abi/ERC20.json";

/**
 * Tikrina naudotojo ERC20 allowance tam tikram spenderiui (dažniausiai admin arba staking contract).
 * Tinkamas tiek staking, tiek dApps sąveikai.
 */
export function useAllowance(requiredAmount = null, customSpender = null) {
  const { chainId, tokenAddress } = useNetwork();
  const { getAddressForChain } = useAuth();

  const [allowanceRaw, setAllowanceRaw] = useState(null);
  const [allowanceFormatted, setAllowanceFormatted] = useState(null);
  const [isApproved, setIsApproved] = useState(false);
  const [decimals, setDecimals] = useState(18);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const user = useMemo(() => getAddressForChain(chainId), [getAddressForChain, chainId]);
  const spender = useMemo(() => customSpender || getAdminAddressByChainId(chainId), [customSpender, chainId]);

  useEffect(() => {
    const fetchAllowance = async () => {
      if (!chainId || !tokenAddress || !user || !spender) return;

      setLoading(true);
      setError(null);

      try {
        const provider = getProviderForChain(chainId);
        const contract = new ethers.Contract(tokenAddress, ERC20ABI, provider);

        const [raw, dec] = await Promise.all([
          contract.allowance(user, spender),
          contract.decimals()
        ]);

        setAllowanceRaw(raw);
        setDecimals(dec);
        const formatted = ethers.formatUnits(raw, dec);
        setAllowanceFormatted(formatted);

        if (requiredAmount != null) {
          const req = ethers.parseUnits(requiredAmount.toString(), dec);
          setIsApproved(raw >= req);
        }
      } catch (err) {
        console.warn("❌ useAllowance error:", err.message);
        setError(err.message);
        setAllowanceRaw(null);
        setAllowanceFormatted(null);
        setIsApproved(false);
      } finally {
        setLoading(false);
      }
    };

    fetchAllowance();
  }, [chainId, tokenAddress, user, spender, requiredAmount]);

  return {
    allowanceRaw,
    allowanceFormatted,
    isApproved,
    decimals,
    loading,
    error,
    spender,
  };
}

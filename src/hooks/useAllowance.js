"use client";

/**
 * useAllowance — v3.0 FINAL META-GRADE
 * ============================================
 * Tikrina ERC20 allowance tarp naudotojo ir spender (admin/staking contract).
 * ✅ Veikia su 36+ EVM tinklų
 * ✅ Pilnas support ERC20 su fallback decimals
 * ✅ Automatinis user + spender adresas
 * ✅ Tikrina requiredAmount (BigInt)
 * ✅ Pilna klaidų kontrolė
 */

import { useEffect, useState, useMemo } from "react";
import { ethers } from "ethers";
import { useAuth } from "@/contexts/AuthContext";
import { useNetwork } from "@/contexts/NetworkContext";
import { getProviderForChain } from "@/utils/getProviderForChain";
import { getAdminAddressByChainId } from "@/utils/networks";
import ERC20ABI from "@/abi/ERC20.json";

export function useAllowance(requiredAmount = null, customSpender = null) {
  const { chainId, tokenAddress } = useNetwork();
  const { getAddressForChain } = useAuth();

  const [allowanceRaw, setAllowanceRaw] = useState(ethers.Zero);
  const [allowanceFormatted, setAllowanceFormatted] = useState("0.0000");
  const [isApproved, setIsApproved] = useState(false);
  const [decimals, setDecimals] = useState(18);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Memoized user + spender address
  const user = useMemo(() => getAddressForChain?.(chainId), [getAddressForChain, chainId]);
  const spender = useMemo(() => customSpender || getAdminAddressByChainId(chainId), [customSpender, chainId]);

  useEffect(() => {
    if (!chainId || !tokenAddress || !user || !spender) return;

    let cancelled = false;

    const fetchAllowance = async () => {
      setLoading(true);
      setError(null);

      try {
        const provider = getProviderForChain(chainId);
        const contract = new ethers.Contract(tokenAddress, ERC20ABI, provider);

        const [raw, dec] = await Promise.all([
          contract.allowance(user, spender),
          contract.decimals().catch(() => 18),
        ]);

        if (cancelled) return;

        setAllowanceRaw(raw);
        setDecimals(dec);

        const formatted = ethers.formatUnits(raw, dec);
        setAllowanceFormatted(formatted);

        if (requiredAmount != null) {
          const required = ethers.parseUnits(requiredAmount.toString(), dec);
          setIsApproved(raw >= required);
        } else {
          setIsApproved(false);
        }
      } catch (err) {
        console.warn("❌ useAllowance error:", err.message);
        if (!cancelled) {
          setError(err.message || "Allowance fetch failed");
          setAllowanceRaw(ethers.Zero);
          setAllowanceFormatted("0.0000");
          setIsApproved(false);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchAllowance();
    return () => {
      cancelled = true;
    };
  }, [chainId, tokenAddress, user, spender, requiredAmount]);

  return {
    allowanceRaw,           // BigInt (wei)
    allowanceFormatted,     // string (e.g. "0.0034")
    isApproved,             // boolean — ar užtenka
    decimals,               // token decimals
    loading,
    error,
    spender,
  };
}

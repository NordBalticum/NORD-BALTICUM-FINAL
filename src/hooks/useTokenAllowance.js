// src/hooks/useTokenAllowance.js
"use client";

/**
 * useTokenAllowance — Final MetaMask-Grade Version
 * ================================================
 * Stebi ERC-20 tokenų allowance tarp user → spender.
 * Automatiškai iš AuthContext gauna user address.
 * Jei `spenderAddress` nepraleistas — naudoja iš networks.js (admin wallet).
 */

import { useEffect, useState } from "react";
import { ethers } from "ethers";
import ERC20ABI from "@/abi/ERC20.json";
import { getProviderForChain } from "@/utils/getProviderForChain";
import { useAuth } from "@/contexts/AuthContext";
import { getAdminAddressByChainId } from "@/utils/networks";

export function useTokenAllowance(chainId, tokenAddress, spenderAddress = null) {
  const { getPrimaryAddress } = useAuth();
  const [rawAllowance, setRawAllowance] = useState(ethers.Zero);
  const [formattedAllowance, setFormattedAllowance] = useState("0");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAllowance = async () => {
      setLoading(true);
      setError(null);

      try {
        if (!chainId || !tokenAddress) throw new Error("Missing chainId or tokenAddress");

        const owner = getPrimaryAddress();
        if (!owner) throw new Error("Missing wallet address");

        const spender = spenderAddress || getAdminAddressByChainId(chainId);
        if (!spender) throw new Error("Missing spender address");

        const provider = getProviderForChain(chainId);
        const contract = new ethers.Contract(tokenAddress, ERC20ABI, provider);

        const raw = await contract.allowance(owner, spender);
        const decimals = await contract.decimals();

        setRawAllowance(raw);
        setFormattedAllowance(ethers.formatUnits(raw, decimals));
      } catch (err) {
        console.warn("❌ useTokenAllowance error:", err.message);
        setError(err.message);
        setRawAllowance(ethers.Zero);
        setFormattedAllowance("0");
      } finally {
        setLoading(false);
      }
    };

    fetchAllowance();
  }, [chainId, tokenAddress, spenderAddress, getPrimaryAddress]);

  return {
    allowance: rawAllowance,             // BigInt (wei)
    formatted: formattedAllowance,      // Human-readable
    loading,
    error,
  };
}

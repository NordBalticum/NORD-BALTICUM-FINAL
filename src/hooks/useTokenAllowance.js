"use client";

/**
 * useTokenAllowance — Final MetaMask-Grade Version v2.0
 * ======================================================
 * Tikrina ERC-20 allowance tarp naudotojo ir kontrakto (spender).
 * • Automatinis user address iš AuthContext
 * • Automatinis spender iš networks.js (jei nenurodytas)
 * • Smart BigInt + formatuotas allowance
 * • Full validation + fallback support
 */

import { useEffect, useState } from "react";
import { ethers } from "ethers";
import ERC20ABI from "@/abi/ERC20.json";
import { useAuth } from "@/contexts/AuthContext";
import { getProviderForChain } from "@/utils/getProviderForChain";
import { getAdminAddressByChainId } from "@/utils/networks";

export function useTokenAllowance(chainId, tokenAddress, spenderAddress = null) {
  const { getPrimaryAddress } = useAuth();

  const [rawAllowance, setRawAllowance] = useState(ethers.Zero);
  const [formattedAllowance, setFormattedAllowance] = useState("0.0000");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!chainId || !tokenAddress) return;

    let isMounted = true;

    const fetchAllowance = async () => {
      setLoading(true);
      setError(null);

      try {
        const owner = getPrimaryAddress();
        const spender = spenderAddress || getAdminAddressByChainId(chainId);

        if (!owner || !ethers.isAddress(owner)) throw new Error("Invalid wallet address");
        if (!spender || !ethers.isAddress(spender)) throw new Error("Invalid spender address");

        const provider = getProviderForChain(chainId);
        const contract = new ethers.Contract(tokenAddress, ERC20ABI, provider);

        const [raw, decimals] = await Promise.all([
          contract.allowance(owner, spender),
          contract.decimals().catch(() => 18),
        ]);

        if (!isMounted) return;

        setRawAllowance(raw);
        setFormattedAllowance(ethers.formatUnits(raw, decimals));
      } catch (err) {
        console.warn("❌ useTokenAllowance error:", err.message);
        if (isMounted) {
          setRawAllowance(ethers.Zero);
          setFormattedAllowance("0.0000");
          setError(err.message);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchAllowance();

    return () => {
      isMounted = false;
    };
  }, [chainId, tokenAddress, spenderAddress, getPrimaryAddress]);

  return {
    allowance: rawAllowance,              // BigInt (wei)
    formatted: formattedAllowance,        // Human-readable string (e.g. "0.0023")
    loading,
    error,
  };
}

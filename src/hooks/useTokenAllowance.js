"use client";

/**
 * useTokenAllowance — MetaMask-Grade ERC20 Allowance Hook
 * ========================================================
 * Tikrina ERC20 tokeno allowance tarp naudotojo ir spender (admin ar nurodytas).
 * - Automatinis naudotojo adresas iš AuthContext
 * - Automatinis spender iš networks.js (nebent nurodytas ranka)
 * - Saugus BigInt + žmogui suprantamas formatuotas tekstas
 * - Apsauga nuo nulinių/neteisingų adresų
 * - Pilnas klaidų valdymas ir išvalymas
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

        // Fetch allowance and decimals in parallel for performance
        const [raw, decimals] = await Promise.all([
          contract.allowance(owner, spender),
          contract.decimals().catch(() => 18), // Default to 18 if no decimals are provided
        ]);

        if (!isMounted) return;

        // Update state with raw allowance and human-readable formatted allowance
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

    // Call the function to fetch allowance
    fetchAllowance();

    // Cleanup function to cancel any ongoing state updates if the component is unmounted
    return () => {
      isMounted = false;
    };
  }, [chainId, tokenAddress, spenderAddress, getPrimaryAddress]);

  return {
    allowance: rawAllowance,             // Raw BigInt (wei)
    formatted: formattedAllowance,       // Human-readable string (e.g., "0.0001")
    loading,                             // Boolean: true if loading data
    error,                               // Error message, if any
  };
}

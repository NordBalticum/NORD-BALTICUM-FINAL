"use client";

/**
 * useTokenName — ERC20 name() fetcher with MetaMask-grade stability
 * ---------------------------------------------------------------
 * Uses a minimal inline ABI. No conflict with the general ABI collection.
 */

import { useEffect, useState } from "react";
import { ethers } from "ethers";
import { getProviderForChain } from "@/utils/getProviderForChain";

// Minimal ABI for the name function
const NAME_ABI = ["function name() view returns (string)"];

export function useTokenName(chainId, tokenAddress) {
  const [name, setName] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    const fetch = async () => {
      if (!chainId || !tokenAddress) return;

      setLoading(true);
      setError(null);

      try {
        // Get the provider for the specific chain
        const provider = getProviderForChain(chainId);
        const contract = new ethers.Contract(tokenAddress, NAME_ABI, provider);

        // Fetch the token name
        const result = await contract.name();
        if (!cancelled) setName(result);  // Update state if not cancelled
      } catch (err) {
        console.warn("❌ useTokenName error:", err.message);
        if (!cancelled) {
          setName(null);  // Set name to null on error
          setError(err.message);  // Set error message
        }
      } finally {
        if (!cancelled) setLoading(false);  // Set loading to false
      }
    };

    fetch();  // Invoke fetch function

    return () => {
      cancelled = true;  // Clean up if the component unmounts
    };
  }, [chainId, tokenAddress]);  // Re-run the effect if chainId or tokenAddress changes

  return { name, loading, error };  // Return the name, loading, and error states
}

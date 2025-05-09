"use client";

/**
 * useTokenHolders — MetaMask-grade token holders fetcher
 * =======================================================
 * Fetches the list of holders for an ERC20 token on an EVM-compatible network.
 * Supports all supported networks and handles errors gracefully.
 */

import { useEffect, useState } from "react";
import { isAddress } from "ethers";
import networks from "@/data/networks";
import { getTokenHolders } from "@/utils/fetchTokenHolders";

export function useTokenHolders(chainId, tokenAddress) {
  const [holders, setHolders] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    const fetch = async () => {
      setLoading(true);
      setError(null);

      try {
        // Validate the chain ID and token address
        if (!chainId || !isAddress(tokenAddress)) {
          throw new Error("Invalid chainId or tokenAddress");
        }

        // Find the corresponding network for the provided chainId
        const network = networks.find(
          (n) => n.chainId === chainId || n.testnet?.chainId === chainId
        );

        if (!network?.explorerApi) {
          throw new Error("Missing explorer API for selected network");
        }

        // Fetch the token holders from the API
        const result = await getTokenHolders(chainId, tokenAddress);
        
        if (!cancelled) {
          setHolders(result); // Store the fetched holders data
        }
      } catch (err) {
        console.warn("❌ Token holders fetch error:", err.message);
        if (!cancelled) {
          setError(err.message); // Set the error state
          setHolders(null); // Clear holders data on error
        }
      } finally {
        if (!cancelled) setLoading(false); // End the loading state
      }
    };

    if (chainId && tokenAddress) fetch(); // Call the fetch function if valid inputs
    return () => {
      cancelled = true; // Cleanup on component unmount
    };
  }, [chainId, tokenAddress]); // Re-run on changes to chainId or tokenAddress

  return { holders, loading, error }; // Return state for holders, loading, and errors
}

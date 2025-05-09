"use client";

/**
 * useTokenInfo — MetaMask-grade ultimate ERC20 token info fetcher
 * ===============================================================
 * Combines name, symbol, decimals, supply, holders into a single hook.
 */

import { useTokenName } from "./useTokenName";
import { useTokenSymbol } from "./useTokenSymbol";
import { useTokenDecimals } from "./useTokenDecimals";
import { useTokenSupply } from "./useTokenSupply";
import { useTokenHolders } from "./useTokenHolders";

export function useTokenInfo(chainId, tokenAddress) {
  const { name, loading: nameLoading, error: nameError } = useTokenName(chainId, tokenAddress);
  const { symbol, loading: symbolLoading, error: symbolError } = useTokenSymbol(chainId, tokenAddress);
  const { decimals, loading: decimalsLoading, error: decimalsError } = useTokenDecimals(chainId, tokenAddress);
  const { supply, loading: supplyLoading, error: supplyError } = useTokenSupply(chainId, tokenAddress);
  const { holders, loading: holdersLoading, error: holdersError } = useTokenHolders(chainId, tokenAddress);

  // Aggregate loading and error states from each hook
  const loading = nameLoading || symbolLoading || decimalsLoading || supplyLoading || holdersLoading;
  const error = nameError || symbolError || decimalsError || supplyError || holdersError;
  const ready = !loading && !error;  // Ready state when all data is loaded and no errors

  return {
    name: name || null,              // Token name (e.g., "Ethereum")
    symbol: symbol || null,          // Token symbol (e.g., "ETH")
    decimals: decimals ?? 18,        // Token decimals (default to 18 if undefined)
    supply: supply ?? "0",           // Token supply (default to "0" if undefined)
    holders: holders ?? 0,           // Number of token holders (default to 0 if undefined)
    loading,                         // Overall loading state
    error,                           // Error state from any of the hooks
    ready,                           // Final readiness state (true if no loading or errors)
  };
}

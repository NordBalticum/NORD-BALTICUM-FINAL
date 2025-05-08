// src/hooks/useTokenInfo.js
"use client";

/**
 * useTokenInfo – MetaMask-grade ultimate ERC20 token info fetcher
 * ===============================================================
 * Sujungia name, symbol, decimals, supply, holders į vieną hook'ą.
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

  const loading = nameLoading || symbolLoading || decimalsLoading || supplyLoading || holdersLoading;
  const error = nameError || symbolError || decimalsError || supplyError || holdersError;
  const ready = !loading && !error;

  return {
    name: name || null,
    symbol: symbol || null,
    decimals: decimals ?? 18,
    supply: supply ?? "0",
    holders: holders ?? 0,
    loading,
    error,
    ready,
  };
}

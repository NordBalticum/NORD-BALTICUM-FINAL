// src/hooks/useTokenInfo.js
"use client";

import { useTokenName } from "./useTokenName";
import { useTokenSymbol } from "./useTokenSymbol";
import { useTokenDecimals } from "./useTokenDecimals";
import { useTokenSupply } from "./useTokenSupply";
import { useTokenHolders } from "./useTokenHolders";

export function useTokenInfo(chainId, tokenAddress) {
  const { name, loading: nameLoading } = useTokenName(chainId, tokenAddress);
  const { symbol, loading: symbolLoading } = useTokenSymbol(chainId, tokenAddress);
  const { decimals, loading: decimalsLoading } = useTokenDecimals(chainId, tokenAddress);
  const { supply, loading: supplyLoading } = useTokenSupply(chainId, tokenAddress);
  const { holders, loading: holdersLoading } = useTokenHolders(chainId, tokenAddress);

  const loading =
    nameLoading || symbolLoading || decimalsLoading || supplyLoading || holdersLoading;

  return {
    name,
    symbol,
    decimals,
    supply,
    holders,
    loading,
  };
}

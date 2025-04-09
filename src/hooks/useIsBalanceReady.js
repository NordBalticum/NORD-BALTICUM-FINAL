"use client";

import { useBalance } from "@/hooks/useBalance";

/**
 * Balances readiness checker
 * - Pirmam užkrovimui
 * - Grįžta true kai balansai paruošti
 */
export function useIsBalancesReady() {
  const { balances, loading: balancesLoading, initialLoading } = useBalance();
  return balances && !initialLoading && !balancesLoading;
}

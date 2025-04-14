"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useNetwork } from "@/contexts/NetworkContext";
import { useBalance } from "@/contexts/BalanceContext";

// ✅ Sistema Ready Hook
export function useSystemReady() {
  const { user, wallet, authLoading, walletLoading } = useAuth();
  const { activeNetwork } = useNetwork();
  const { balances, loading: balancesLoading } = useBalance();

  const isClient = typeof window !== "undefined";

  // ✅ Minimalus readiness: vartotojas, wallet ir aktyvus tinklas
  const minimalReady = isClient && user?.email && wallet?.wallet && activeNetwork;

  // ✅ Balansų readiness: kai turim bent vieną balansą
  const hasBalances = balances && Object.keys(balances).length > 0;

  // ✅ Viskas READY tik jei visos sąlygos įvykdytos
  const ready = minimalReady && !authLoading && !walletLoading && hasBalances && !balancesLoading;

  // ✅ Loading statusas
  const loading = !ready;

  return { ready, loading };
}

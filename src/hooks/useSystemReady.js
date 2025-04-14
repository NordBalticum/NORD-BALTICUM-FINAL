"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useNetwork } from "@/contexts/NetworkContext";
import { useBalance } from "@/contexts/BalanceContext";

// ✅ Sistema Ready Hook
export function useSystemReady() {
  const { user, wallet, authLoading, walletLoading } = useAuth();
  const { activeNetwork } = useNetwork();
  const { balances } = useBalance(); // ✅ balancesLoading NEBENAUDOJAM

  const isClient = typeof window !== "undefined";

  // ✅ Minimalus readiness: vartotojas, wallet adresas ir aktyvus tinklas
  const minimalReady =
    isClient &&
    !!user?.email &&
    !!wallet?.wallet?.address &&
    !!activeNetwork;

  // ✅ Balansų readiness: kai turim bent vieną balansą
  const hasBalances =
    balances &&
    Object.keys(balances).length > 0;

  // ✅ READY logika: viskas kartu
  const ready =
    minimalReady &&
    !authLoading &&
    !walletLoading &&
    hasBalances;

  // ✅ Loading statusas
  const loading = !ready;

  return { ready, loading };
}

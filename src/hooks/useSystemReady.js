"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useNetwork } from "@/contexts/NetworkContext";
import { useBalance } from "@/contexts/BalanceContext";
import { useSend } from "@/contexts/SendContext";

export function useSystemReady() {
  const { user, wallet, authLoading, walletLoading } = useAuth();
  const { activeNetwork } = useNetwork();
  const { balances, loading: balancesLoading, error: balancesError } = useBalance();
  const { sending } = useSend();

  const isClient = typeof window !== "undefined";

  const hasBalances = balances && Object.keys(balances).length > 0;
  const minimalReady = user?.email && wallet?.wallet && activeNetwork; // Minimal login

  // ✅ READY taisyklės:
  const ready =
    isClient && minimalReady && !authLoading && !walletLoading && !sending;

  // ✅ LOADING taisyklės:
  const loading =
    !ready || balancesLoading; // Kol ready arba balances dar neparuošti → loading true

  // ✅ ERROR taisyklės:
  const hasError = balancesError ? true : false;

  return { ready, loading, hasError };
}

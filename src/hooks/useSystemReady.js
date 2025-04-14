"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useNetwork } from "@/contexts/NetworkContext";
import { useBalance } from "@/contexts/BalanceContext";

export function useSystemReady() {
  const { user, wallet, authLoading, walletLoading } = useAuth();
  const { activeNetwork } = useNetwork();
  const { balances } = useBalance();

  const isClient = typeof window !== "undefined";

  const minimalReady = user?.email && wallet?.wallet && activeNetwork;

  const hasBalances = balances && Object.keys(balances).length > 0;

  const ready =
    isClient &&
    minimalReady &&
    !authLoading &&
    !walletLoading &&
    hasBalances; // ✅ Privalom turėti bent 1 balansą

  const loading = !ready;

  return { ready, loading };
}

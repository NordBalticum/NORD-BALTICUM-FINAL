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

  const ready =
    isClient &&
    minimalReady &&
    !authLoading &&
    !walletLoading;

  const loading = !ready;

  return { ready, loading };
}

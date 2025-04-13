"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useBalance } from "@/contexts/BalanceContext";
import { useNetwork } from "@/contexts/NetworkContext";
import { useSend } from "@/contexts/SendContext";

export function useSystemReady() {
  const { user, wallet, authLoading, walletLoading } = useAuth();
  const { balances, prices, loading: balancesLoading } = useBalance();
  const { activeNetwork } = useNetwork();
  const { sending } = useSend();

  const isClient = typeof window !== "undefined";

  // ✅ Visi readiness check'ai
  const ready = isClient
    && user?.email
    && wallet?.wallet
    && activeNetwork
    && balances
    && prices
    && !authLoading
    && !walletLoading
    && !balancesLoading
    && !sending;

  const loading = !ready;

  return { ready, loading };
}

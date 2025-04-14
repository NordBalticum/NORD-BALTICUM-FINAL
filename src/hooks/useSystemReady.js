"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useNetwork } from "@/contexts/NetworkContext";
import { useBalance } from "@/contexts/BalanceContext";

export function useSystemReady() {
  const { user, wallet, authLoading, walletLoading } = useAuth();
  const { activeNetwork } = useNetwork();
  const { balances } = useBalance();

  const isClient = typeof window !== "undefined";

  // ✅ Tikrinam ar email + wallet + tinklas yra
  const minimalReady = user?.email && wallet?.wallet && activeNetwork;

  // ✅ FULL READY taisyklės
  const ready =
    isClient &&
    minimalReady &&
    !authLoading &&
    !walletLoading;

  // ✅ Balanso lygis: jei turim bent 1 balansą
  const hasBalances = balances && Object.keys(balances).length > 0;

  // ✅ Loading taisyklės (tik tada jei realiai reikia)
  const loading = !ready || !hasBalances;

  return { ready, loading };
}

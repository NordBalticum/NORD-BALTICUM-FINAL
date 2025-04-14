"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useNetwork } from "@/contexts/NetworkContext";
import { useBalance } from "@/contexts/BalanceContext";

export function useSystemReady() {
  const { user, wallet, authLoading, walletLoading } = useAuth();
  const { activeNetwork } = useNetwork();
  const { balances, loading: balancesLoading } = useBalance(); // ✅ Imame balances + loading statusą

  const isClient = typeof window !== "undefined";

  // ✅ Minimalus readiness: user email + wallet + pasirinktas tinklas
  const minimalReady = isClient && user?.email && wallet?.wallet && activeNetwork;

  // ✅ Balansų readiness: kai bent 1 balansas egzistuoja
  const hasBalances = balances && Object.keys(balances).length > 0;

  // ✅ Sistema READY jei:
  const ready = minimalReady && !authLoading && !walletLoading && hasBalances && !balancesLoading;

  // ✅ Sistema kraunasi jei bet kuris iš šitų nėra pilnai pasiruošęs
  const loading = !ready;

  return { ready, loading };
}

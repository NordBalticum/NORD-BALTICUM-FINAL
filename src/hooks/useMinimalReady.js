"use client";

import { useAuth } from "@/contexts/AuthContext";

// ✅ Minimal readiness hook
export function useMinimalReady() {
  const { user, wallet, authLoading, walletLoading } = useAuth();

  const isClient = typeof window !== "undefined";

  // ✅ Tikrinam ar yra vartotojas ir wallet adresas
  const hasUserAndWallet = Boolean(user?.email && wallet?.wallet);

  // ✅ Sistema READY tik jei:
  const ready = isClient && hasUserAndWallet && !authLoading && !walletLoading;

  // ✅ Jei ne ready - vadinasi loading
  const loading = !ready;

  return { ready, loading };
}

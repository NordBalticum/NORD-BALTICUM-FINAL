"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useNetwork } from "@/contexts/NetworkContext";

export function useMinimalReady() {
  const { user, wallet, authLoading, walletLoading } = useAuth();
  const { activeNetwork } = useNetwork();

  const isClient = typeof window !== "undefined";

  // ✅ Minimalus login reikalavimas
  const minimalReady = user?.email && wallet?.wallet && activeNetwork;

  // ✅ READY taisyklės
  const ready =
    isClient &&
    minimalReady &&
    !authLoading &&
    !walletLoading;

  // ✅ Loading (kai dar nėra ready)
  const loading = !ready;

  return { ready, loading };
}

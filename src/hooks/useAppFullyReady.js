"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useNetwork } from "@/contexts/NetworkContext";

export function useAppFullyReady() {
  const { user, wallet, authLoading, walletLoading } = useAuth();
  const { activeNetwork } = useNetwork();

  const isClient = typeof window !== "undefined";

  const ready = isClient && user?.email && wallet?.wallet && activeNetwork && !authLoading && !walletLoading;
  const loading = !ready;

  return { ready, loading };
}

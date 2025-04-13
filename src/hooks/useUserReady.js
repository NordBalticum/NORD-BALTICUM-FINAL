"use client";

import { useAuth } from "@/contexts/AuthContext";

export function useUserReady() {
  const { user, wallet, authLoading, walletLoading } = useAuth();

  const isClient = typeof window !== "undefined";

  const ready = isClient && user?.email && wallet?.wallet && !authLoading && !walletLoading;
  const loading = !ready;

  return { ready, loading };
}

"use client";

import { useAuth } from "@/contexts/AuthContext";

export function useMinimalReady() {
  const { user, wallet, authLoading, walletLoading } = useAuth();

  const isClient = typeof window !== "undefined";

  const minimalReady = user?.email && wallet?.wallet;

  const ready =
    isClient &&
    minimalReady &&
    !authLoading &&
    !walletLoading;

  const loading = !ready;

  return { ready, loading };
}

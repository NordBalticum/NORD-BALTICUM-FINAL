// src/hooks/useWalletStatus.js
"use client";

import { useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";

/**
 * useWalletStatus – Ultra hook for wallet readiness and diagnostics.
 */
export function useWalletStatus() {
  const {
    wallet,
    walletLoading,
    getPrimaryAddress,
    getAllSigners,
  } = useAuth();

  const isConnected = !!wallet?.wallet;
  const address = getPrimaryAddress();
  const signerCount = Object.keys(getAllSigners() || {}).length;

  const isReady = useMemo(() => {
    return isConnected && !!address && signerCount > 0 && !walletLoading;
  }, [isConnected, address, signerCount, walletLoading]);

  return {
    address,
    ready: isReady,
    loading: walletLoading,
    isConnected,
    signerCount,
    walletObject: wallet?.wallet || null,
    allSigners: getAllSigners(),
  };
}

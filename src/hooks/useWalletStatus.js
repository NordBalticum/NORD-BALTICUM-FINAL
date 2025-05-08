// src/hooks/useWalletStatus.js
"use client";

import { useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";

export function useWalletStatus() {
  const { wallet, walletLoading, getPrimaryAddress } = useAuth();

  const isReady = useMemo(() => {
    return !!wallet?.wallet && !!getPrimaryAddress() && !walletLoading;
  }, [wallet, getPrimaryAddress, walletLoading]);

  return {
    address: getPrimaryAddress(),
    ready: isReady,
    loading: walletLoading,
    isConnected: !!wallet?.wallet,
    signerCount: Object.keys(wallet?.signers || {}).length,
  };
}

"use client";

/**
 * useWalletStatus — Final MetaMask-Grade Hook
 * ============================================
 * Stebi naudotojo wallet būseną (prisijungimas, adresas, signeriai, loading).
 * Naudoja AuthContext ir grąžina visa diagnostinę info, naudinga visur.
 */

import { useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";

export function useWalletStatus() {
  const {
    wallet,
    walletLoading,
    getPrimaryAddress,
    getAllSigners,
  } = useAuth();

  const address = getPrimaryAddress();
  const signers = getAllSigners() || {};
  const signerCount = Object.keys(signers).length;

  const isConnected = !!wallet?.wallet;
  const isReady = useMemo(() => {
    return isConnected && !!address && signerCount > 0 && !walletLoading;
  }, [isConnected, address, signerCount, walletLoading]);

  return {
    ready: isReady,
    loading: walletLoading,
    isConnected,
    address,
    signerCount,
    walletObject: wallet?.wallet || null,
    allSigners: signers,
    diagnostics: {
      hasWallet: !!wallet,
      hasSigners: signerCount > 0,
      hasAddress: !!address,
    },
  };
}

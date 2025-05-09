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
    ready: isReady,                        // Whether wallet is fully ready for interaction
    loading: walletLoading,                 // Indicates whether wallet is still loading
    isConnected,                           // Whether the wallet is connected
    address,                               // The primary address associated with the wallet
    signerCount,                           // The number of available signers
    walletObject: wallet?.wallet || null,   // Wallet object with full details, null if not connected
    allSigners: signers,                   // All available signers
    diagnostics: {
      hasWallet: !!wallet,                 // Whether wallet object is present
      hasSigners: signerCount > 0,         // Whether there are any available signers
      hasAddress: !!address,               // Whether the wallet has a primary address
    },
    debug: {
      // For debugging purposes, returns additional wallet state details
      walletState: wallet,
      addressState: address,
      signersState: signers,
      readyState: isReady,
    }
  };
}

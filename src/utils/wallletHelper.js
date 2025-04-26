// src/utils/walletHelper.js
"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useNetwork } from "@/contexts/NetworkContext";

/**
 * Grąžina signerį pagal aktyvų tinklą (arba null)
 */
export function useActiveSigner() {
  const { wallet } = useAuth();
  const { activeNetwork } = useNetwork();

  if (!wallet?.signers || !activeNetwork) return null;

  const signer = wallet.signers[activeNetwork];
  return signer ?? null;
}

/**
 * Grąžina providerį pagal aktyvų tinklą (arba null)
 */
export function useActiveProvider() {
  const signer = useActiveSigner();
  return signer?.provider ?? null;
}

/**
 * Patikrina ar yra aktyvus signeris
 */
export function useHasActiveSigner() {
  const signer = useActiveSigner();
  return !!signer;
}

/**
 * Paimti address'ą iš active signer
 */
export function useWalletAddress() {
  const signer = useActiveSigner();
  return signer?.address ?? null;
}

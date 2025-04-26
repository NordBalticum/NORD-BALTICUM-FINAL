// src/utils/walletHelper.js
"use client";

import { useMemo } from "react";
import { ethers, JsonRpcProvider } from "ethers";
import { useAuth } from "@/contexts/AuthContext";
import { useNetwork } from "@/contexts/NetworkContext";
import { getProviderForChain } from "@/utils/getProviderForChain";

/**
 * Return active signer — automatic detection.
 * Works both with direct privateKey and signers[network].
 */
export function useActiveSigner() {
  const { wallet } = useAuth();
  const { chainId, activeNetwork } = useNetwork();

  return useMemo(() => {
    if (!wallet) return null;

    // 1. Direct signer if available (modern method)
    if (wallet.wallet?.privateKey && chainId) {
      try {
        const provider = getProviderForChain(chainId);
        return new ethers.Wallet(wallet.wallet.privateKey, provider);
      } catch (err) {
        console.error("[useActiveSigner] Wallet privateKey signer error:", err?.message || err);
        return null;
      }
    }

    // 2. Legacy signers by network (old system)
    if (wallet.signers && activeNetwork) {
      const signer = wallet.signers[activeNetwork];
      return signer ?? null;
    }

    return null;
  }, [wallet, chainId, activeNetwork]);
}

/**
 * Return active signer provider (if signer exists).
 */
export function useActiveProvider() {
  const signer = useActiveSigner();
  return signer?.provider ?? null;
}

/**
 * Check if there is an active signer available.
 */
export function useHasActiveSigner() {
  const signer = useActiveSigner();
  return !!signer;
}

/**
 * Return public address from active signer.
 */
export function useWalletAddress() {
  const signer = useActiveSigner();
  return signer?.address ?? null;
}

/**
 * Create standalone signer manually (for decrypted keys or external usage).
 */
export async function createStandaloneSigner(privateKey, chainId) {
  if (!privateKey || !chainId) throw new Error("❌ Missing private key or chainId");
  const provider = getProviderForChain(chainId);
  return new ethers.Wallet(privateKey, provider);
}

/**
 * Fetch wallet balance for any address + chainId combo.
 */
export async function getBalanceForAddress(address, chainId) {
  if (!ethers.isAddress(address)) throw new Error("❌ Invalid address format");
  const provider = getProviderForChain(chainId);
  const balance = await provider.getBalance(address);
  return parseFloat(ethers.formatEther(balance));
}

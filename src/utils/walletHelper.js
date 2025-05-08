"use client";

import { useMemo } from "react";
import { ethers } from "ethers";
import { useAuth } from "@/contexts/AuthContext";
import { useNetwork } from "@/contexts/NetworkContext";
import { getProviderForChain } from "@/utils/getProviderForChain";
import { supabase } from "@/utils/supabaseClient";

// =============================================
// 🧠 Return active signer (context or fallback)
// =============================================
export function useActiveSigner() {
  const { wallet, email } = useAuth();
  const { chainId } = useNetwork();

  return useMemo(() => {
    if (!wallet || !wallet.wallet?.privateKey || !chainId) return null;

    try {
      const provider = getProviderForChain(chainId);
      return new ethers.Wallet(wallet.wallet.privateKey, provider);
    } catch (err) {
      console.error("[useActiveSigner] Wallet signer error:", err);
      return null;
    }
  }, [wallet, chainId]);
}

// =============================================
// 📡 Return provider from active signer
// =============================================
export function useActiveProvider() {
  const signer = useActiveSigner();
  return signer?.provider ?? null;
}

// =============================================
// ✅ Check if signer is active
// =============================================
export function useHasActiveSigner() {
  return !!useActiveSigner();
}

// =============================================
// 🪪 Get signer address (if available)
// =============================================
export function useWalletAddress() {
  const signer = useActiveSigner();
  return signer?.address ?? null;
}

// =============================================
// 🔐 Fallback standalone signer from privKey
// =============================================
export async function createStandaloneSigner(privateKey, chainId) {
  if (!privateKey || !chainId) throw new Error("❌ Missing key or chain");
  const provider = getProviderForChain(chainId);
  return new ethers.Wallet(privateKey, provider);
}

// =============================================
// 💰 Get balance for address + chain combo
// =============================================
export async function getBalanceForAddress(address, chainId) {
  if (!ethers.isAddress(address)) throw new Error("❌ Invalid address");
  const provider = getProviderForChain(chainId);
  const balance = await provider.getBalance(address);
  return parseFloat(ethers.formatEther(balance));
}

// =============================================
// 🧪 Get fallback signer from Supabase
// =============================================
export async function getSupabaseSigner(email, chainId) {
  const { data, error } = await supabase
    .from("wallets")
    .select("encrypted_key")
    .eq("user_email", email)
    .maybeSingle();

  if (error || !data?.encrypted_key) {
    throw new Error("❌ Encrypted key not found in Supabase");
  }

  const { decryptKey } = await import("@/utils/aesDecrypt");
  const privKey = await decryptKey(data.encrypted_key);

  const provider = getProviderForChain(chainId);
  return new ethers.Wallet(privKey, provider);
}

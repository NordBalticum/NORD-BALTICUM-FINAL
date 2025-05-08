"use client";

/**
 * useTokenTransferFrom — MetaMask-grade v2.0
 * ==========================================
 * Leis ERC20 tokenų `transferFrom(from → to)` su pilnu saugumu, decimals palaikymu ir klaidų kontrole.
 */

import { useState } from "react";
import { ethers } from "ethers";
import ERC20ABI from "@/utils/erc20ABI"; // saugesnė, minimali ABI versija
import { useAuth } from "@/contexts/AuthContext";

export function useTokenTransferFrom(chainId, tokenAddress) {
  const { getSignerForChain } = useAuth();

  const [sending, setSending] = useState(false);
  const [txHash, setTxHash] = useState(null);
  const [error, setError] = useState(null);

  const transferFrom = async (from, to, amount) => {
    setSending(true);
    setError(null);
    setTxHash(null);

    try {
      const signer = getSignerForChain(chainId);
      if (!signer) throw new Error("No signer available");
      if (!ethers.isAddress(from) || !ethers.isAddress(to)) {
        throw new Error("Invalid from/to address");
      }
      if (!ethers.isAddress(tokenAddress)) {
        throw new Error("Invalid token address");
      }

      const contract = new ethers.Contract(tokenAddress, ERC20ABI, signer);
      const decimals = await contract.decimals().catch(() => 18);
      const amt = ethers.parseUnits(amount.toString(), decimals);

      const tx = await contract.transferFrom(from, to, amt);
      setTxHash(tx.hash);
      await tx.wait();

    } catch (err) {
      console.warn("❌ useTokenTransferFrom error:", err.message);
      setError(err.message || "Transfer failed");
    } finally {
      setSending(false);
    }
  };

  return {
    transferFrom,
    sending,
    txHash,
    error,
  };
}

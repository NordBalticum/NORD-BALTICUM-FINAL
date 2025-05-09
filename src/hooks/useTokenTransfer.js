"use client";

/**
 * useTokenTransfer — MetaMask-grade ERC20 token transfer hook
 * ============================================================
 * • Tikrina adresą, amount, decimals
 * • Turi signer, tx.wait, ir klaidų valdymą
 * • Visiškai paruoštas 24/7 naudojimui
 */

import { useState } from "react";
import { ethers } from "ethers";
import ERC20ABI from "@/abi/ERC20.json";
import { useAuth } from "@/contexts/AuthContext";

export function useTokenTransfer(chainId, tokenAddress) {
  const { getSignerForChain } = useAuth();

  const [transferring, setTransferring] = useState(false);
  const [txHash, setTxHash] = useState(null);
  const [error, setError] = useState(null);

  /**
   * Perform token transfer.
   * @param {string} to - Recipient address
   * @param {string|number} amount - Amount to transfer (human-readable)
   */
  const transfer = async (to, amount) => {
    setTransferring(true);
    setError(null);
    setTxHash(null);

    try {
      if (!ethers.isAddress(to)) throw new Error("Invalid recipient address");
      if (!tokenAddress || !ethers.isAddress(tokenAddress)) throw new Error("Invalid token address");
      if (!amount || isNaN(amount) || Number(amount) <= 0) throw new Error("Invalid amount");

      const signer = getSignerForChain(chainId);
      if (!signer) throw new Error("No signer available");

      // Connect to the contract
      const contract = new ethers.Contract(tokenAddress, ERC20ABI, signer);

      // Handle decimals and ensure amount is parsed correctly
      const decimals = await contract.decimals().catch(() => 18);  // Fallback to 18 decimals if no decimals function
      const amt = ethers.parseUnits(amount.toString(), decimals);

      // Transfer the tokens
      const tx = await contract.transfer(to, amt);
      setTxHash(tx.hash);
      await tx.wait(); // Wait for transaction confirmation

    } catch (err) {
      console.warn("❌ useTokenTransfer error:", err.message);
      setError(err.message || "Transfer failed");
    } finally {
      setTransferring(false);
    }
  };

  return {
    transfer,
    transferring,
    txHash,
    error,
  };
}

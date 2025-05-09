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

  /**
   * Perform ERC20 token transfer from one address to another.
   * @param {string} from - The address from which tokens will be transferred.
   * @param {string} to - The recipient address.
   * @param {string|number} amount - The amount of tokens to transfer (human-readable).
   */
  const transferFrom = async (from, to, amount) => {
    setSending(true);
    setError(null);
    setTxHash(null);

    try {
      const signer = getSignerForChain(chainId);
      if (!signer) throw new Error("No signer available");

      // Validate addresses
      if (!ethers.isAddress(from) || !ethers.isAddress(to)) {
        throw new Error("Invalid from/to address");
      }
      if (!ethers.isAddress(tokenAddress)) {
        throw new Error("Invalid token address");
      }

      // Connect to the token contract
      const contract = new ethers.Contract(tokenAddress, ERC20ABI, signer);
      const decimals = await contract.decimals().catch(() => 18); // Fallback to 18 decimals if no decimals function
      const amt = ethers.parseUnits(amount.toString(), decimals); // Parse the amount to the correct format

      // Execute the transferFrom transaction
      const tx = await contract.transferFrom(from, to, amt);
      setTxHash(tx.hash); // Set the transaction hash
      await tx.wait(); // Wait for the transaction to be mined

    } catch (err) {
      console.warn("❌ useTokenTransferFrom error:", err.message);
      setError(err.message || "Transfer failed");
    } finally {
      setSending(false); // Reset the sending state after the transaction is complete or failed
    }
  };

  return {
    transferFrom, // Function to trigger the token transfer
    sending,      // Loading state while the transfer is being processed
    txHash,       // Transaction hash once the transfer is sent
    error,        // Error state in case of failure
  };
}

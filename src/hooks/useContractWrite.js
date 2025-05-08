// src/hooks/useContractWrite.js
"use client";

import { useState } from "react";
import { ethers } from "ethers";
import { useAuth } from "@/contexts/AuthContext";

/**
 * useContractWrite – universalus hookas smart contractų metodų siuntimui
 *
 * @param {number} chainId - tinklo ID
 * @param {string} contractAddress - kontrakto adresas
 * @param {any[]} abi - kontrakto ABI
 */
export function useContractWrite(chainId, contractAddress, abi) {
  const { getSignerForChain } = useAuth();

  const [txHash, setTxHash] = useState(null);
  const [error, setError] = useState(null);
  const [writing, setWriting] = useState(false);
  const [receipt, setReceipt] = useState(null);

  /**
   * Vykdyti kontrakto metodą
   * @param {string} method - kontrakto metodo pavadinimas
   * @param {any[]} args - metodo argumentai
   * @param {object} overrides - tx overrides (pvz. value)
   */
  const write = async (method, args = [], overrides = {}) => {
    setWriting(true);
    setError(null);
    setTxHash(null);
    setReceipt(null);

    try {
      if (!chainId || !contractAddress || !abi || !method) {
        throw new Error("⚠️ Missing required parameters");
      }

      const signer = getSignerForChain(chainId);
      if (!signer) throw new Error("⚠️ Signer unavailable");

      const contract = new ethers.Contract(contractAddress, abi, signer);

      const tx = await contract[method](...args, overrides);
      setTxHash(tx.hash);

      const receipt = await tx.wait();
      setReceipt(receipt);
    } catch (err) {
      console.warn("❌ useContractWrite error:", err.message);
      setError(err.message);
    } finally {
      setWriting(false);
    }
  };

  return {
    write,
    writing,
    txHash,
    receipt,
    error,
  };
}

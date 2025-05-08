"use client";

import { useState, useCallback } from "react";
import { ethers } from "ethers";
import { useAuth } from "@/contexts/AuthContext";

/**
 * useContractWrite – universalus smart contract metodų vykdymo hook'as su tx hash, kvitu (receipt) ir klaidų tvarkymu.
 *
 * @param {number} chainId - tinklo ID
 * @param {string} contractAddress - kontrakto adresas
 * @param {any[]} abi - kontrakto ABI
 * @returns { write, writing, txHash, receipt, error }
 */
export function useContractWrite(chainId, contractAddress, abi) {
  const { getSignerForChain } = useAuth();

  const [txHash, setTxHash] = useState(null);
  const [receipt, setReceipt] = useState(null);
  const [error, setError] = useState(null);
  const [writing, setWriting] = useState(false);

  const write = useCallback(async (method, args = [], overrides = {}) => {
    setWriting(true);
    setError(null);
    setTxHash(null);
    setReceipt(null);

    try {
      if (!chainId || !contractAddress || !abi || !method) {
        throw new Error("Missing contract info");
      }

      const signer = getSignerForChain(chainId);
      if (!signer) throw new Error("Signer unavailable");

      const contract = new ethers.Contract(contractAddress, abi, signer);

      if (typeof contract[method] !== "function") {
        throw new Error(`Method "${method}" does not exist on contract`);
      }

      const tx = await contract[method](...args, overrides);
      setTxHash(tx.hash);

      const result = await tx.wait();
      setReceipt(result);
    } catch (err) {
      console.error("❌ useContractWrite error:", err.message);
      setError(err.message || "Transaction failed");
    } finally {
      setWriting(false);
    }
  }, [chainId, contractAddress, abi, getSignerForChain]);

  return {
    write,
    writing,
    txHash,
    receipt,
    error,
  };
}

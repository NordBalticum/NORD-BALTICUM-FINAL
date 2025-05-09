"use client";

/**
 * useContractWrite — universalus smart contract rašymo hook'as
 * =============================================================
 * Veikia su visais EVM tinklais ir bet kokiu kontraktu/metodu.
 * ✅ Grąžina tx hash, receipt, klaidą, writing statusą
 * ✅ Dirba su overrides (gas, value, t.t.)
 * ✅ MetaMask-grade bulletproof veikimas
 */

import { useState, useCallback } from "react";
import { ethers } from "ethers";
import { useAuth } from "@/contexts/AuthContext";

export function useContractWrite(chainId, contractAddress, abi) {
  const { getSignerForChain } = useAuth();

  const [txHash, setTxHash] = useState(null);
  const [receipt, setReceipt] = useState(null);
  const [error, setError] = useState(null);
  const [writing, setWriting] = useState(false);

  const write = useCallback(
    async (method, args = [], overrides = {}) => {
      setWriting(true);
      setError(null);
      setTxHash(null);
      setReceipt(null);

      try {
        if (!chainId || !ethers.isAddress(contractAddress) || !abi || !method) {
          throw new Error("Missing or invalid contract info");
        }

        const signer = getSignerForChain(chainId);
        if (!signer) throw new Error("Signer unavailable");

        const contract = new ethers.Contract(contractAddress, abi, signer);

        if (typeof contract[method] !== "function") {
          throw new Error(`Method "${method}" not found in contract`);
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
    },
    [chainId, contractAddress, abi, getSignerForChain]
  );

  return {
    write,        // (methodName, args[], overrides?) => tx
    writing,      // bool
    txHash,       // string|null
    receipt,      // tx receipt object|null
    error,        // string|null
  };
}

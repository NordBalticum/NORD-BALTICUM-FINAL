"use client";

/**
 * useContractRead — universalus `view`/`pure` smart contract metodų skaitymo hookas
 * ==================================================================================
 * Veikia su visais EVM tinklais ir ABI — skaito bet kurį `view` ar `pure` metodą.
 * ✅ Automatinis refetch (watch režimas)
 * ✅ Full fallback + klaidų sauga
 * ✅ MetaMask-grade stabilumas
 */

import { useEffect, useState, useCallback } from "react";
import { ethers } from "ethers";
import { getProviderForChain } from "@/utils/getProviderForChain";

export function useContractRead(
  chainId,
  contractAddress,
  abi,
  method,
  args = [],
  watch = false,
  intervalMs = 10000
) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const readContract = useCallback(async () => {
    if (!chainId || !ethers.isAddress(contractAddress) || !abi || !method) return;

    try {
      setLoading(true);
      setError(null);

      const provider = getProviderForChain(chainId);
      const contract = new ethers.Contract(contractAddress, abi, provider);

      if (typeof contract[method] !== "function") {
        throw new Error(`Method "${method}" not found in contract`);
      }

      const result = await contract[method](...args);
      setData(result);
    } catch (err) {
      console.warn("❌ useContractRead error:", err.message);
      setError(err.message || "Read failed");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [chainId, contractAddress, abi, method, JSON.stringify(args)]);

  useEffect(() => {
    readContract();

    if (!watch) return;

    const interval = setInterval(() => {
      readContract();
    }, intervalMs);

    return () => clearInterval(interval);
  }, [readContract, watch, intervalMs]);

  return {
    data,        // Raw result
    loading,     // boolean
    error,       // string|null
    refetch: readContract, // callable
  };
}

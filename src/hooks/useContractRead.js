"use client";

import { useEffect, useState, useCallback } from "react";
import { ethers } from "ethers";
import { getProviderForChain } from "@/utils/getProviderForChain";

/**
 * useContractRead – universalus hookas bet kokio `view` arba `pure` smart contract metodo skaitymui.
 *
 * @param {number} chainId - tinklo ID
 * @param {string} contractAddress - kontrakto adresas
 * @param {any[]} abi - kontrakto ABI
 * @param {string} method - metodo pavadinimas
 * @param {any[]} args - argumento masyvas
 * @param {boolean} [watch=false] - ar automatiškai refrešinti duomenis kas X sekundžių
 * @param {number} [intervalMs=10000] - intervalas milisekundėmis, jeigu watch=true
 */
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
    if (!chainId || !contractAddress || !abi || !method) return;

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
      setError(err.message);
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

  return { data, loading, error, refetch: readContract };
}

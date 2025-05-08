// src/hooks/useContractRead.js
"use client";

import { useEffect, useState } from "react";
import { ethers } from "ethers";
import { getProviderForChain } from "@/utils/getProviderForChain";

/**
 * useContractRead – universalus hookas smart contract view duomenų skaitymui
 *
 * @param {number} chainId - tinklo ID
 * @param {string} contractAddress - kontrakto adresas
 * @param {any[]} abi - kontrakto ABI
 * @param {string} method - view/pure metodo pavadinimas
 * @param {any[]} args - metodo argumentai
 */
export function useContractRead(chainId, contractAddress, abi, method, args = []) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!chainId || !contractAddress || !abi || !method) return;

    const fetch = async () => {
      setLoading(true);
      setError(null);
      setData(null);

      try {
        const provider = getProviderForChain(chainId);
        const contract = new ethers.Contract(contractAddress, abi, provider);
        const result = await contract[method](...args);
        setData(result);
      } catch (err) {
        console.warn("❌ useContractRead error:", err.message);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetch();
  }, [chainId, contractAddress, abi, method, JSON.stringify(args)]);

  return { data, loading, error };
}

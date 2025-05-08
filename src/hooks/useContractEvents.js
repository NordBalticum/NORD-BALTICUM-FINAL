// src/hooks/useContractEvents.js
"use client";

import { useEffect, useState } from "react";
import { ethers } from "ethers";
import { getProviderForChain } from "@/utils/getProviderForChain";

/**
 * useContractEvents – klausyti kontrakto įvykių (eventų) realiu laiku
 *
 * @param {number} chainId - EVM tinklo ID
 * @param {string} contractAddress - kontrakto adresas
 * @param {any[]} abi - kontrakto ABI
 * @param {string} eventName - sekamas įvykis
 * @param {Function} [filterFn] - pasirinktinis filtravimo callback (optional)
 */
export function useContractEvents(chainId, contractAddress, abi, eventName, filterFn) {
  const [events, setEvents] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!chainId || !contractAddress || !abi || !eventName) return;

    let contract;
    let provider;

    try {
      provider = getProviderForChain(chainId);
      contract = new ethers.Contract(contractAddress, abi, provider);

      const handler = (...args) => {
        const event = args[args.length - 1]; // paskutinis argumentas – event object
        const parsed = {
          args,
          blockNumber: event.blockNumber,
          transactionHash: event.transactionHash,
        };

        setEvents((prev) => {
          const all = [...prev, parsed];
          return filterFn ? all.filter(filterFn) : all;
        });
      };

      contract.on(eventName, handler);

      return () => {
        contract.off(eventName, handler);
      };
    } catch (err) {
      console.warn("❌ useContractEvents error:", err.message);
      setError(err.message);
    }

    return () => {};
  }, [chainId, contractAddress, abi, eventName, filterFn]);

  return { events, error };
}

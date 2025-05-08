"use client";

import { useEffect, useState, useRef } from "react";
import { ethers, Interface } from "ethers";
import { getProviderForChain } from "@/utils/getProviderForChain";

/**
 * useContractEvents – stebėti EVM kontrakto eventus realiu laiku.
 *
 * @param {number} chainId - EVM tinklo ID
 * @param {string} contractAddress - kontrakto adresas
 * @param {any[]} abi - kontrakto ABI
 * @param {string} eventName - sekamas įvykis (tikslus pavadinimas)
 * @param {Function} [filterFn] - pasirinktinis filtravimo callback
 *
 * @returns { events, error, clearEvents }
 */
export function useContractEvents(chainId, contractAddress, abi, eventName, filterFn = null) {
  const [events, setEvents] = useState([]);
  const [error, setError] = useState(null);
  const seenTxs = useRef(new Set()); // Unikalūs TX hashai duplikatų filtravimui

  useEffect(() => {
    if (!chainId || !contractAddress || !abi || !eventName) return;

    let contract;
    let provider;

    try {
      provider = getProviderForChain(chainId);
      const iface = new Interface(abi);
      contract = new ethers.Contract(contractAddress, abi, provider);

      const listener = (...args) => {
        const event = args[args.length - 1]; // paskutinis argumentas – event object
        if (!event || !event.transactionHash) return;

        // Duplikatų guard
        if (seenTxs.current.has(event.transactionHash)) return;
        seenTxs.current.add(event.transactionHash);

        try {
          const parsed = iface.parseLog(event);
          const structured = {
            name: parsed.name,
            args: parsed.args,
            txHash: event.transactionHash,
            blockNumber: event.blockNumber,
            timestamp: Date.now(),
          };

          setEvents((prev) => {
            const updated = [...prev, structured];
            return filterFn ? updated.filter(filterFn) : updated;
          });
        } catch (parseErr) {
          console.warn("⚠️ Failed to parse event:", parseErr.message);
        }
      };

      contract.on(eventName, listener);

      return () => {
        contract.off(eventName, listener);
      };
    } catch (err) {
      console.warn("❌ useContractEvents error:", err.message);
      setError(err.message);
    }

    return () => {};
  }, [chainId, contractAddress, abi, eventName, filterFn]);

  const clearEvents = () => {
    setEvents([]);
    seenTxs.current.clear();
  };

  return { events, error, clearEvents };
}

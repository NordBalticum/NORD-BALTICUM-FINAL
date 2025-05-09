"use client";

/**
 * useContractEvents — MetaMask-grade contract event hook
 * ========================================================
 * Realiu laiku stebi nurodytą EVM kontrakto įvykį.
 * ✅ Palaiko visus 36+ tinklus per getProviderForChain
 * ✅ Automatinė `Interface` eventų dekodacija
 * ✅ Unikalūs TX filtrai (ref-based)
 * ✅ Automatinis listener cleanup (off)
 */

import { useEffect, useState, useRef } from "react";
import { ethers, Interface } from "ethers";
import { getProviderForChain } from "@/utils/getProviderForChain";

export function useContractEvents(chainId, contractAddress, abi, eventName, filterFn = null) {
  const [events, setEvents] = useState([]);
  const [error, setError] = useState(null);
  const seenTxs = useRef(new Set());

  useEffect(() => {
    if (!chainId || !contractAddress || !abi || !eventName) return;

    let contract;
    let provider;
    let iface;
    let listener;

    try {
      provider = getProviderForChain(chainId);
      iface = new Interface(abi);
      contract = new ethers.Contract(contractAddress, abi, provider);

      listener = (...args) => {
        const event = args[args.length - 1];
        if (!event || !event.transactionHash) return;

        const hash = event.transactionHash;
        if (seenTxs.current.has(hash)) return;
        seenTxs.current.add(hash);

        try {
          const parsed = iface.parseLog(event);
          const structured = {
            name: parsed.name,
            args: parsed.args,
            txHash: hash,
            blockNumber: event.blockNumber,
            timestamp: Date.now(),
          };

          setEvents((prev) => {
            const updated = [...prev, structured];
            return filterFn ? updated.filter(filterFn) : updated;
          });
        } catch (parseErr) {
          console.warn("⚠️ Event parse failed:", parseErr.message);
        }
      };

      contract.on(eventName, listener);
    } catch (err) {
      console.warn("❌ useContractEvents error:", err.message);
      setError(err.message);
    }

    return () => {
      if (contract && listener) {
        try {
          contract.off(eventName, listener);
        } catch (cleanupErr) {
          console.warn("⚠️ Event cleanup failed:", cleanupErr.message);
        }
      }
    };
  }, [chainId, contractAddress, abi, eventName, filterFn]);

  const clearEvents = () => {
    setEvents([]);
    seenTxs.current.clear();
  };

  return {
    events,        // all structured logs (name, args, txHash, etc.)
    error,         // string|null
    clearEvents,   // function to reset log list
  };
}

"use client";

/**
 * useFeeEstimates — Final MetaMask-Grade Gas Fee Hook
 * ====================================================
 * Palaiko tiek EIP-1559, tiek legacy tinklus.
 * Grąžina slow/average/fast dujų kainas bei bazinę kainą (baseFee).
 * Visiškai suderinta su 36+ EVM tinklais, deploy-safe.
 */

import { useEffect, useState } from "react";
import { getProviderForChain } from "@/utils/getProviderForChain";

export function useFeeEstimates(chainId) {
  const [fees, setFees] = useState({
    baseFee: null,
    slow: null,
    average: null,
    fast: null,
    legacy: null,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!chainId) return;

    let cancelled = false;

    const fetchFees = async () => {
      setLoading(true);
      setError(null);

      try {
        const provider = getProviderForChain(chainId);
        const latest = await provider.getBlock("latest");

        if (latest?.baseFeePerGas) {
          // EIP-1559 network
          const base = BigInt(latest.baseFeePerGas.toString());

          const slow = base + base / 10n;     // +10%
          const avg = base + base / 5n;       // +20%
          const fast = base + base / 3n;      // +33%

          if (!cancelled) {
            setFees({
              baseFee: base,
              slow,
              average: avg,
              fast,
              legacy: null,
            });
          }
        } else {
          // Legacy network fallback
          const legacyGasPrice = await provider.getGasPrice();
          const gas = BigInt(legacyGasPrice.toString());

          if (!cancelled) {
            setFees({
              baseFee: null,
              slow: gas,
              average: gas,
              fast: gas,
              legacy: gas,
            });
          }
        }
      } catch (err) {
        console.warn("❌ useFeeEstimates error:", err.message);
        if (!cancelled) {
          setError(err.message || "Failed to fetch gas estimates");
          setFees({
            baseFee: null,
            slow: null,
            average: null,
            fast: null,
            legacy: null,
          });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchFees();
    return () => {
      cancelled = true;
    };
  }, [chainId]);

  return {
    baseFee: fees.baseFee,   // null | BigInt
    slow: fees.slow,         // null | BigInt
    average: fees.average,   // null | BigInt
    fast: fees.fast,         // null | BigInt
    legacy: fees.legacy,     // null | BigInt
    loading,
    error,
  };
}

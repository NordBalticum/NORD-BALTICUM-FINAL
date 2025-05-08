"use client";

import { useEffect, useState } from "react";
import { getProviderForChain } from "@/utils/getProviderForChain";

/**
 * useFeeEstimates – MetaMask-grade dujų kainų skaičiavimas (EIP-1559 + legacy)
 *
 * @param {number} chainId – tinklo ID
 * @returns { baseFee, slow, average, fast, legacy, loading, error }
 */
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

    const fetchFees = async () => {
      setLoading(true);
      setError(null);

      try {
        const provider = getProviderForChain(chainId);
        const latest = await provider.getBlock("latest");

        // EIP-1559 support
        if (latest?.baseFeePerGas) {
          const base = BigInt(latest.baseFeePerGas.toString());

          const slow = base + base / 10n;
          const avg = base + base / 5n;
          const fast = base + base / 3n;

          setFees({
            baseFee: base,
            slow,
            average: avg,
            fast,
            legacy: null,
          });
        } else {
          // Legacy network (e.g., BNB)
          const legacyGasPrice = await provider.getGasPrice();
          setFees({
            baseFee: null,
            slow: legacyGasPrice,
            average: legacyGasPrice,
            fast: legacyGasPrice,
            legacy: legacyGasPrice,
          });
        }
      } catch (err) {
        console.warn("❌ useFeeEstimates error:", err.message);
        setError(err.message || "Failed to fetch gas estimates");
        setFees({
          baseFee: null,
          slow: null,
          average: null,
          fast: null,
          legacy: null,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchFees();
  }, [chainId]);

  return { ...fees, loading, error };
}

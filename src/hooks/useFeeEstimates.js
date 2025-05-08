// src/hooks/useFeeEstimates.js
"use client";

import { useEffect, useState } from "react";
import { getProviderForChain } from "@/utils/getProviderForChain";

export function useFeeEstimates(chainId) {
  const [loading, setLoading] = useState(true);
  const [fees, setFees] = useState({
    baseFee: null,
    slow: null,
    average: null,
    fast: null,
    legacy: null,
  });
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!chainId) return;

    const fetchFees = async () => {
      setLoading(true);
      setError(null);

      try {
        const provider = getProviderForChain(chainId);
        const latest = await provider.getBlock("latest");

        if (!latest.baseFeePerGas) {
          // Legacy gas model fallback
          const gasPrice = await provider.getGasPrice();
          setFees({
            baseFee: null,
            slow: gasPrice,
            average: gasPrice,
            fast: gasPrice,
            legacy: gasPrice,
          });
        } else {
          const base = BigInt(latest.baseFeePerGas.toString());

          setFees({
            baseFee: base,
            slow: base + base / 10n,
            average: base + base / 5n,
            fast: base + base / 3n,
            legacy: null,
          });
        }
      } catch (err) {
        setError(err.message || "Failed to estimate fees");
      } finally {
        setLoading(false);
      }
    };

    fetchFees();
  }, [chainId]);

  return { fees, loading, error };
}

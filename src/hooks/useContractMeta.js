"use client";

import { useEffect, useState } from "react";
import { ethers } from "ethers";
import ERC20_ABI from "@/abi/ERC20.json";
import { getProviderForChain } from "@/utils/getProviderForChain";

export function useContractMeta(chainId, contractAddress) {
  const [meta, setMeta] = useState({ name: null, symbol: null, decimals: 18 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!chainId || !contractAddress) return;

    let cancelled = false;

    const fetchMeta = async () => {
      setLoading(true);
      setError(null);

      try {
        const provider = getProviderForChain(chainId);
        const contract = new ethers.Contract(contractAddress, ERC20_ABI, provider);

        const [name, symbol, decimals] = await Promise.all([
          contract.name().catch(() => null),
          contract.symbol().catch(() => null),
          contract.decimals().catch(() => 18),
        ]);

        if (!cancelled) {
          setMeta({ name: name || "Unknown", symbol: symbol || "???", decimals });
        }
      } catch (err) {
        console.warn("❌ useContractMeta error:", err.message);
        if (!cancelled) {
          setError(err.message);
          setMeta({ name: "Unknown", symbol: "???", decimals: 18 });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchMeta();
    return () => {
      cancelled = true;
    };
  }, [chainId, contractAddress]);

  return { ...meta, loading, error };
}

"use client";

/**
 * useContractMeta — universalus kontrakto metaduomenų hook'as
 * =============================================================
 * Palaiko bet kurį EVM kontraktą (ERC20, ERC721, t.t.) su name/symbol/decimals.
 * Automatinis fallback, apsauga nuo klaidų, deploy-ready su 36+ tinklų palaikymu.
 */

import { useEffect, useState } from "react";
import { ethers } from "ethers";
import ERC20_ABI from "@/abi/ERC20.json";
import { getProviderForChain } from "@/utils/getProviderForChain";

export function useContractMeta(chainId, contractAddress) {
  const [meta, setMeta] = useState({
    name: null,
    symbol: null,
    decimals: 18,
    valid: false,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!chainId || !ethers.isAddress(contractAddress)) return;

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
          setMeta({
            name: name || "Unknown",
            symbol: symbol || "???",
            decimals: decimals ?? 18,
            valid: !!name || !!symbol,
          });
        }
      } catch (err) {
        console.warn("❌ useContractMeta error:", err.message);
        if (!cancelled) {
          setError(err.message || "Metadata fetch failed");
          setMeta({
            name: "Unknown",
            symbol: "???",
            decimals: 18,
            valid: false,
          });
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

  return {
    ...meta,
    loading,
    error,
  };
}

"use client";

/**
 * useTokenSymbol — MetaMask-grade ERC20 simbolio hook'as
 * ========================================================
 * • Pritaikytas visiems EVM tinklams
 * • SSR-safe, fallback į "???" jeigu neįmanoma gauti simbolio
 * • Apsaugotas nuo neteisingų address/chainId
 */

import { useEffect, useState } from "react";
import { ethers } from "ethers";
import ERC20ABI from "@/abi/ERC20.json";
import { getProviderForChain } from "@/utils/getProviderForChain";

export function useTokenSymbol(chainId, tokenAddress) {
  const [symbol, setSymbol] = useState("???");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!chainId || !tokenAddress || !ethers.isAddress(tokenAddress)) return;

    let cancelled = false;

    const fetch = async () => {
      setLoading(true);
      setError(null);

      try {
        const provider = getProviderForChain(chainId);
        const contract = new ethers.Contract(tokenAddress, ERC20ABI, provider);
        const result = await contract.symbol();
        if (!cancelled) setSymbol(result || "???");
      } catch (err) {
        console.warn("❌ useTokenSymbol error:", err.message);
        if (!cancelled) {
          setSymbol("???");
          setError(err.message);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetch();
    return () => {
      cancelled = true;
    };
  }, [chainId, tokenAddress]);

  return {
    symbol,
    loading,
    error,
  };
}

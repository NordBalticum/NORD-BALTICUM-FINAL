// src/hooks/useNativeCurrency.js
"use client";

/**
 * useNativeCurrency — Final MetaMask-Grade Version
 * =================================================
 * Grąžina natyvaus EVM tinklo valiutos informaciją (pvz., ETH, MATIC, AVAX, BNB).
 * Palaiko testnetus ir saugią fallback logiką.
 */

import { useMemo } from "react";
import networks from "@/data/networks";

export function useNativeCurrency(chainId) {
  return useMemo(() => {
    if (!chainId || typeof chainId !== "number") {
      return {
        symbol: "ETH",
        label: "Unknown",
        decimals: 18,
        icon: null,
      };
    }

    const net = networks.find(
      (n) => n.chainId === chainId || n.testnet?.chainId === chainId
    );

    if (!net) {
      return {
        symbol: "ETH",
        label: "Unknown",
        decimals: 18,
        icon: null,
      };
    }

    return {
      symbol: net.nativeSymbol || net.nativeCurrency?.symbol || "ETH",
      label: net.label || "Unknown",
      decimals: net.nativeCurrency?.decimals || 18,
      icon: net.icon || null,
    };
  }, [chainId]);
}

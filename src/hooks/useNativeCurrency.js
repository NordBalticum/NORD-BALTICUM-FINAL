"use client";

/**
 * useNativeCurrency — MetaMask-Grade Native Token Hook
 * =====================================================
 * Grąžina natyvaus EVM tinklo valiutos duomenis (symbol, label, decimals, icon).
 * - Palaiko 36+ tinklus (mainnet + testnet)
 * - Naudoja saugią fallback logiką
 * - Visiškai integruotas su networks.js
 */

import { useMemo } from "react";
import networks from "@/data/networks";

export function useNativeCurrency(chainId) {
  return useMemo(() => {
    // Default fallback jei neteisingas chainId
    if (!chainId || typeof chainId !== "number") {
      return {
        symbol: "ETH",
        label: "Unknown",
        decimals: 18,
        icon: null,
      };
    }

    // Surandame tinklą pagal chainId arba testnet chainId
    const net = networks.find(
      (n) => n.chainId === chainId || n.testnet?.chainId === chainId
    );

    // Jei nepavyksta rasti — fallback į ETH
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
      label: net.label || net.name || "Unknown Network",
      decimals: net.nativeCurrency?.decimals || 18,
      icon: net.icon || null,
    };
  }, [chainId]);
}

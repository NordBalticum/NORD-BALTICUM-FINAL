// src/hooks/useNativeCurrency.js
"use client";

import networks from "@/data/networks";

export function useNativeCurrency(chainId) {
  if (!chainId) return { symbol: "ETH", label: "Ethereum", decimals: 18 };

  const net = networks.find(
    (n) => n.chainId === chainId || n.testnet?.chainId === chainId
  );

  if (!net) return { symbol: "ETH", label: "Unknown", decimals: 18 };

  return {
    symbol: net.nativeSymbol || "ETH",
    label: net.label,
    decimals: 18,
  };
}

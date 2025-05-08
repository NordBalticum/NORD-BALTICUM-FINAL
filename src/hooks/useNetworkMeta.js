"use client";

/**
 * useNetworkMeta — Full Network Metadata Hook
 * ============================================
 * Grąžina visus EVM tinklo metaduomenis (label, icon, explorer, gas, native, rpc, testnet).
 * Visiškai pritaikytas `networks.js` struktūrai.
 */

import { useMemo } from "react";
import { useNetwork } from "@/contexts/NetworkContext";
import networks from "@/data/networks";

export function useNetworkMeta() {
  const { activeNetwork, chainId, isTestnet, tokenSymbol, tokenAddress } = useNetwork();

  return useMemo(() => {
    const net = networks.find(
      (n) => n.value === activeNetwork || n.testnet?.value === activeNetwork
    );

    const merged = net || {};

    return {
      activeNetwork,
      chainId,
      isTestnet,
      tokenSymbol,
      tokenAddress,

      // Display
      label: merged.label || "Unknown",
      icon: merged.icon || null,

      // Explorer info
      explorer: merged.explorer || null,
      explorerApi: merged.explorerApi || null,

      // Native token info
      nativeSymbol: merged.nativeSymbol || merged.nativeCurrency?.symbol || "ETH",
      nativeDecimals: merged.nativeCurrency?.decimals || 18,

      // RPC info
      rpcUrls: merged.rpcUrls || [],
      fallbackGas: merged.fallbackGas || "0.001",

      // Chain metadata
      chainName: merged.name || merged.label || "Unknown Network",
      networkId: merged.chainId || chainId || 0,
      isLegacy: merged.isLegacy || false,
    };
  }, [activeNetwork, chainId, isTestnet, tokenSymbol, tokenAddress]);
}

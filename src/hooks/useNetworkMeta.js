// src/hooks/useNetworkMeta.js
"use client";

import { useNetwork } from "@/contexts/NetworkContext";
import networks from "@/data/networks";

export function useNetworkMeta() {
  const { activeNetwork, chainId, isTestnet, tokenSymbol, tokenAddress } = useNetwork();

  const network = networks.find(
    (n) => n.value === activeNetwork || n.testnet?.value === activeNetwork
  );

  return {
    activeNetwork,
    chainId,
    isTestnet,
    tokenSymbol,
    tokenAddress,
    label: network?.label || "Unknown",
    icon: network?.icon || null,
    explorer: network?.explorer || null,
    explorerApi: network?.explorerApi || null,
    rpcUrls: network?.rpcUrls || [],
    nativeSymbol: network?.nativeSymbol || "ETH",
  };
}

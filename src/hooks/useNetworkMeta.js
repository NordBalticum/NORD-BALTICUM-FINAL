"use client";

/**
 * useNetworkMeta — Full Network Metadata Hook (MetaMask-Grade)
 * =============================================================
 * Grąžina visus EVM tinklo metaduomenis (label, icon, explorer, gas, native, rpc, testnet, token).
 * Palaiko 36+ EVM grandinių struktūrą pagal `networks.js`.
 * Naudoja `NetworkContext` — saugus, greitas, deploy-ready.
 */

import { useMemo } from "react";
import { useNetwork } from "@/contexts/NetworkContext";
import networks from "@/data/networks";

export function useNetworkMeta() {
  const {
    activeNetwork,
    chainId,
    isTestnet,
    tokenSymbol,
    tokenAddress,
  } = useNetwork();

  return useMemo(() => {
    // Tikslus match su mainnet arba testnet
    const net = networks.find(
      (n) => n.value === activeNetwork || n.testnet?.value === activeNetwork
    );

    const fallbackChainId = chainId || net?.chainId || 0;

    return {
      activeNetwork,
      chainId: fallbackChainId,
      isTestnet,
      tokenSymbol,
      tokenAddress,

      // Display info
      label: net?.label || "Unknown",
      icon: net?.icon || null,

      // Block explorer
      explorer: net?.explorer || null,
      explorerApi: net?.explorerApi || null,

      // Native currency
      nativeSymbol: net?.nativeSymbol || net?.nativeCurrency?.symbol || "ETH",
      nativeDecimals: net?.nativeCurrency?.decimals || 18,

      // RPC & Gas
      rpcUrls: net?.rpcUrls || [],
      fallbackGas: net?.fallbackGas || "0.001",

      // CoinGecko & CoinCap
      coinGeckoId: net?.coinGeckoId || null,
      coinCapId: net?.coinCapId || null,

      // Meta
      chainName: net?.name || net?.label || "Unknown Network",
      networkId: net?.chainId || fallbackChainId,
      isLegacy: net?.isLegacy || false,
      isTestnet: isTestnet || net?.isTestnet || false,
    };
  }, [activeNetwork, chainId, isTestnet, tokenSymbol, tokenAddress]);
}

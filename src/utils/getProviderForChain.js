"use client";

import { ethers } from "ethers";
import { ethersFallbackProviders } from "@/utils/fallbackRPCs";
import networks from "@/data/networks";

const providerCache = new Map();

/**
 * Get chainId from network name or testnet name
 */
function getChainIdFromName(name) {
  const lower = name.trim().toLowerCase();

  for (const net of networks) {
    if (net.value === lower) return net.chainId;
    if (net.testnet && net.testnet.value === lower) return net.testnet.chainId;
  }
  return null;
}

/**
 * Returns a JsonRpcProvider or FallbackProvider
 */
export function getProviderForChain(chainIdOrName) {
  // Normalize to chainId
  let chainId = typeof chainIdOrName === "string"
    ? Number(chainIdOrName.trim())
    : chainIdOrName;

  if (typeof chainIdOrName === "string" && isNaN(chainId)) {
    const found = getChainIdFromName(chainIdOrName);
    if (found != null) {
      chainId = found;
    }
  }

  if (typeof chainId !== "number" || isNaN(chainId)) {
    throw new Error(`Invalid chainIdOrName "${chainIdOrName}"`);
  }

  // Check cache
  if (providerCache.has(chainId)) {
    return providerCache.get(chainId);
  }

  const urls = ethersFallbackProviders[chainId];
  if (!urls?.length) {
    throw new Error(`❌ No RPC endpoints for chainId ${chainId}`);
  }

  let provider;
  if (urls.length === 1) {
    // Single provider
    provider = new ethers.JsonRpcProvider(urls[0], {
      chainId,
      name: "unknown",
    });
  } else {
    // Multiple providers with fallback
    const providers = urls.map(url => 
      new ethers.JsonRpcProvider(url, {
        chainId,
        name: "unknown",
      })
    );

    const configs = providers.map(p => ({
      provider: p,
      priority: 1,
      weight: 1,
      stallTimeout: 200,
    }));

    provider = new ethers.FallbackProvider(configs, { quorum: 1 });
  }

  // Verify network connection
  provider.getNetwork()
    .then(net => console.debug(`🔗 Connected to chainId ${net.chainId}`))
    .catch(err => console.warn(`⚠️ Cannot detect network ${chainId}:`, err.message));

  // Listen for network changes
  provider.on?.("network", (newNet, oldNet) => {
    if (oldNet) {
      console.debug(`🔄 Network switch: ${oldNet.chainId} → ${newNet.chainId}`);
    }
  });

  // Cache and return
  providerCache.set(chainId, provider);
  return provider;
}

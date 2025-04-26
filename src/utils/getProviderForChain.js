"use client";

import { ethers } from "ethers";
import { ethersFallbackProviders } from "@/utils/fallbackRPCs";
import networks from "@/data/networks";

const providerCache = new Map();

/**
 * Randa chainId pagal "value" iš networks.js
 */
function getChainIdFromName(name) {
  const lower = name.trim().toLowerCase();

  // Patikrinam mainnet'us
  for (const net of networks) {
    if (net.value === lower) {
      return net.chainId;
    }
    // Patikrinam testnet'us
    if (net.testnet && net.testnet.value === lower) {
      return net.testnet.chainId;
    }
  }
  return null;
}

/**
 * Grąžina vieną veikiantį JsonRpcProvider arba FallbackProvider
 *
 * @param {string|number} chainIdOrName – pvz. "137", 56 arba "polygon"
 * @returns {ethers.JsonRpcProvider|ethers.FallbackProvider}
 */
export function getProviderForChain(chainIdOrName) {
  // 1) normalizuojame į skaičių
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

  // 2) tikrinam cache
  if (providerCache.has(chainId)) {
    return providerCache.get(chainId);
  }

  // 3) paimame RPC URL’us
  const urls = ethersFallbackProviders[chainId];
  if (!urls?.length) {
    throw new Error(`❌ No RPC endpoints for chainId ${chainId}`);
  }

  // 4) sudedam providerį
  let provider;
  if (urls.length === 1) {
    provider = new ethers.JsonRpcProvider(urls[0], chainId);
  } else {
    const backends = urls.map(u => new ethers.JsonRpcProvider(u, chainId));
    const configs = backends.map(p => ({
      provider: p,
      priority: 1,
      weight: 1,
      stallTimeout: 200,
    }));
    provider = new ethers.FallbackProvider(configs, { quorum: 1 });
  }

  // 5) automatinis tinklo patikrinimas
  provider.getNetwork()
    .then(net => console.debug(`🔗 Connected to chainId ${net.chainId}`))
    .catch(err => console.warn(`⚠️ Cannot detect network ${chainId}:`, err));

  // 6) stebim tinklo pasikeitimus
  provider.on("network", (newNet, oldNet) => {
    if (oldNet) {
      console.debug(`🔄 Network switch: ${oldNet.chainId} → ${newNet.chainId}`);
    }
  });

  // 7) cache + return
  providerCache.set(chainId, provider);
  return provider;
}

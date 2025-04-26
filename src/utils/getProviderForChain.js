// src/utils/getProviderForChain.js
"use client";

import { ethers } from "ethers";
import { ethersFallbackProviders } from "@/utils/fallbackRPCs";
import networks from "@/data/networks";

const providerCache = new Map();

function getChainIdFromName(name) {
  const lower = name.trim().toLowerCase();
  for (const net of networks) {
    if (net.value === lower) return net.chainId;
    if (net.testnet && net.testnet.value === lower) return net.testnet.chainId;
  }
  return null;
}

export function getProviderForChain(chainIdOrName) {
  // 1) normalize to numeric chainId
  let chainId = typeof chainIdOrName === "string"
    ? Number(chainIdOrName.trim())
    : chainIdOrName;
  if (typeof chainIdOrName === "string" && isNaN(chainId)) {
    const found = getChainIdFromName(chainIdOrName);
    if (found != null) chainId = found;
  }
  if (typeof chainId !== "number" || isNaN(chainId)) {
    throw new Error(`Invalid chainIdOrName "${chainIdOrName}"`);
  }

  // 2) cache?
  if (providerCache.has(chainId)) {
    return providerCache.get(chainId);
  }

  // 3) grab URLs
  const urls = ethersFallbackProviders[chainId];
  if (!urls?.length) {
    throw new Error(`❌ No RPC endpoints for chainId ${chainId}`);
  }

  let provider;
  if (urls.length === 1) {
    // single RPC
    provider = new ethers.JsonRpcProvider(urls[0], {
      chainId,
      name: "unknown"
    });
  } else {
    // multiple RPCs → build fallback config array
    const backends = urls.map(url =>
      new ethers.JsonRpcProvider(url, { chainId, name: "unknown" })
    );

    const configs = backends.map(p => ({
      provider:    p,
      priority:    1,
      weight:      1,
      stallTimeout: 200
    }));

    // ←–– HERE is the key fix: pass network *then* options
    provider = new ethers.FallbackProvider(
      configs,
      { chainId, name: "unknown" },   // ← network
      { quorum: 1 }                   // ← options
    );
  }

  // debug + network‐change listener
  provider.getNetwork()
    .then(net => console.debug(`🔗 Connected to chainId ${net.chainId}`))
    .catch(err => console.warn(`⚠️ Cannot detect network ${chainId}:`, err.message));

  provider.on?.("network", (newNet, oldNet) => {
    if (oldNet) {
      console.debug(`🔄 Network switch: ${oldNet.chainId} → ${newNet.chainId}`);
    }
  });

  providerCache.set(chainId, provider);
  return provider;
}

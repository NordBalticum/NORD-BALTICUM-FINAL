// src/utils/getProviderForChain.js
"use client";

import { ethers } from "ethers";
import { ethersFallbackProviders } from "./fallbackRPCs";

/**  
 * Friendly name → chainId map. Extend as you add new networks.  
 */
const CHAIN_NAME_TO_ID = {
  eth:             1,
  sepolia:        11155111,
  matic:          137,
  mumbai:         80001,
  bnb:             56,
  tbnb:            97,
  avax:           43114,
  fuji:           43113,
  optimism:        10,
  optimismgoerli:  420,
  arbitrum:      42161,
  arbitrumgoerli:421613,
  base:           8453,
  basegoerli:    84531,
  zksync:         324,
  zksynctest:     280,
  linea:        59144,
  lineatest:    59140,
  scroll:      534352,
  scrolltest:  534353,
  mantle:        5000,
  mantletest:    5001,
  celo:         42220,
  alfajores:    44787,
  gnosis:        100,
  chiado:      10200,
};

const providerCache = new Map();

/**
 * Get a JsonRpcProvider or FallbackProvider for any EVM chain.
 *
 * @param {string|number} chainIdOrName – e.g. 1, "137", "mumbai", "optimism", etc.
 * @returns {ethers.JsonRpcProvider|ethers.FallbackProvider}
 */
export function getProviderForChain(chainIdOrName) {
  // 1) Normalize to numeric chainId
  let chainId = typeof chainIdOrName === "string"
    ? Number(chainIdOrName.trim())
    : chainIdOrName;

  // If input was a friendly name, map it
  if (typeof chainIdOrName === "string" && isNaN(chainId)) {
    const key = chainIdOrName.trim().toLowerCase();
    if (CHAIN_NAME_TO_ID[key] != null) {
      chainId = CHAIN_NAME_TO_ID[key];
    }
  }

  if (typeof chainId !== "number" || isNaN(chainId)) {
    throw new Error(`Invalid chainIdOrName "${chainIdOrName}"`);
  }

  // 2) Return cached provider if available
  if (providerCache.has(chainId)) {
    return providerCache.get(chainId);
  }

  // 3) Look up RPC URLs from your fallbackRPCs map
  const urls = ethersFallbackProviders[chainId];
  if (!urls?.length) {
    throw new Error(`❌ No RPC endpoints configured for chainId ${chainId}`);
  }

  let provider;
  if (urls.length === 1) {
    // Single‐URL → simple JsonRpcProvider
    provider = new ethers.JsonRpcProvider(urls[0], chainId);
  } else {
    // Multi‐URL → FallbackProvider
    const backends = urls.map(url => new ethers.JsonRpcProvider(url, chainId));
    const configs = backends.map(p => ({
      provider:     p,
      priority:     1,      // all equal priority
      weight:       1,      // equal weighting
      stallTimeout: 200     // ms before trying next
    }));
    try {
      provider = new ethers.FallbackProvider(configs /* ethers v6: no quorum arg here */);
    } catch (err) {
      console.warn(`FallbackProvider init failed for chain ${chainId}, using single RPC:`, err);
      provider = backends[0];
    }
  }

  // 4) Eagerly detect network (catches mis-configs immediately)
  provider.getNetwork()
    .then(net => console.debug(`🔗 Provider connected → chainId ${net.chainId}`))
    .catch(err => console.warn(`⚠️ Network detection failed for chain ${chainId}:`, err));

  // 5) Listen for any on-the-fly network switches
  provider.on("network", (newNet, oldNet) => {
    if (oldNet) {
      console.debug(`🔄 Provider network changed: ${oldNet.chainId} → ${newNet.chainId}`);
    }
  });

  // 6) Cache & return
  providerCache.set(chainId, provider);
  return provider;
}

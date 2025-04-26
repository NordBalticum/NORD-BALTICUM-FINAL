// src/utils/getProviderForChain.js
"use client";

import { ethers } from "ethers";
import { ethersFallbackProviders } from "@/utils/fallbackRPCs";
import networks from "@/data/networks";

const providerCache = new Map();

/**
 * Išgauna chainId pagal name arba testnet name iš networks.js
 */
function getChainIdFromName(name) {
  const lower = name.trim().toLowerCase();

  for (const net of networks) {
    if (net.value === lower) {
      return net.chainId;
    }
    if (net.testnet && net.testnet.value === lower) {
      return net.testnet.chainId;
    }
  }
  return null;
}

/**
 * Suteikia pilną ethers.js providerį su automatiniais fallback'ais
 *
 * @param {string|number} chainIdOrName – pvz. "polygon", 137, "mumbai"
 * @returns {ethers.JsonRpcProvider|ethers.FallbackProvider}
 */
export function getProviderForChain(chainIdOrName) {
  // 1) Normalizuojam į chainId skaičių
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

  // 2) Tikrinam cache
  if (providerCache.has(chainId)) {
    return providerCache.get(chainId);
  }

  // 3) Pasiimam RPC URL'us
  const urls = ethersFallbackProviders[chainId];
  if (!urls?.length) {
    throw new Error(`❌ No RPC endpoints for chainId ${chainId}`);
  }

  // 4) Sukuriam providerį
  let provider;

  if (urls.length === 1) {
    // Vienas URL — paprastas provideris
    provider = new ethers.JsonRpcProvider(urls[0], {
      chainId,
      name: "unknown", // ethers@6 reikalauja name
    });
  } else {
    // Keli URL'ai — fallback provideris
    const backends = urls.map(url => 
      new ethers.JsonRpcProvider(url, {
        chainId,
        name: "unknown",
      })
    );

    const configs = backends.map(p => ({
      provider: p,
      priority: 1,
      weight: 1,
      stallTimeout: 200, // ms
    }));

    provider = new ethers.FallbackProvider(configs, { quorum: 1 });
  }

  // 5) Automatinis tinklo patikrinimas (debug purposes)
  provider.getNetwork()
    .then(net => console.debug(`🔗 Connected to chainId ${net.chainId}`))
    .catch(err => console.warn(`⚠️ Cannot detect network ${chainId}:`, err.message));

  // 6) Stebim network switch'us
  provider.on?.("network", (newNet, oldNet) => {
    if (oldNet) {
      console.debug(`🔄 Network switch: ${oldNet.chainId} → ${newNet.chainId}`);
    }
  });

  // 7) Cache ir gražinam
  providerCache.set(chainId, provider);
  return provider;
}

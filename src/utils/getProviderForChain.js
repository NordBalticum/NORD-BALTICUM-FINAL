// src/utils/getProviderForChain.js
"use client";

import { ethers } from "ethers";
import { ethersFallbackProviders } from "./fallbackRPCs";

/**  
 * Draugiški pavadinimai → numeriniai chainId  
 */
const CHAIN_NAME_TO_ID = {
  eth: 1, sepolia: 11155111,
  matic: 137, mumbai: 80001,
  bnb: 56, tbnb: 97,
  avax: 43114, fuji: 43113,
  optimism: 10, optimismgoerli: 420,
  arbitrum: 42161, arbitrumgoerli: 421613,
  base: 8453, basegoerli: 84531,
  zksync: 324, zksynctest: 280,
  linea: 59144, lineatest: 59140,
  scroll: 534352, scrolltest: 534353,
  mantle: 5000, mantletest: 5001,
  celo: 42220, alfajores: 44787,
  gnosis: 100, chiado: 10200,
};

const providerCache = new Map();

/**
 * Grąžina vieną veikiantį JsonRpcProvider arba FallbackProvider
 * be jokio CORS bloko (naudojame tik Ankr RPC su tavo API raktu).
 *
 * @param {string|number} chainIdOrName – pvz. "137", 56 arba "matic"
 * @returns {ethers.JsonRpcProvider|ethers.FallbackProvider}
 */
export function getProviderForChain(chainIdOrName) {
  // 1) normalizuojame į skaičių
  let chainId = typeof chainIdOrName === "string"
    ? Number(chainIdOrName.trim())
    : chainIdOrName;
  if (typeof chainIdOrName === "string" && isNaN(chainId)) {
    const key = chainIdOrName.trim().toLowerCase();
    if (CHAIN_NAME_TO_ID[key] != null) {
      chainId = CHAIN_NAME_TO_ID[key];
    }
  }
  if (typeof chainId !== "number" || isNaN(chainId)) {
    throw new Error(`Invalid chainIdOrName "${chainIdOrName}"`);
  }

  // 2) jeigu jau buvo sukurtas – grąžinam cache’ą
  if (providerCache.has(chainId)) {
    return providerCache.get(chainId);
  }

  // 3) paimame tik Ankr RPC URL’us iš fallbackRPCs
  const urls = ethersFallbackProviders[chainId];
  if (!urls?.length) {
    throw new Error(`❌ No RPC endpoints for chainId ${chainId}`);
  }

  // 4) sudedam provider’į
  let provider;
  if (urls.length === 1) {
    // vienas Ankr URL
    provider = new ethers.JsonRpcProvider(urls[0], chainId);
  } else {
    // keli Ankr URL’ai – FallbackProvider su quorum=1
    const backends = urls.map(u => new ethers.JsonRpcProvider(u, chainId));
    const configs = backends.map(p => ({
      provider: p,
      priority: 1,
      weight: 1,
      stallTimeout: 200,
    }));
    provider = new ethers.FallbackProvider(configs, { quorum: 1 });
  }

  // 5) iškart patikriname ryšį
  provider.getNetwork()
    .then(net => console.debug(`🔗 Connected to chainId ${net.chainId}`))
    .catch(err => console.warn(`⚠️ Cannot detect network ${chainId}:`, err));

  // 6) stebime galimus network switch’us
  provider.on("network", (newNet, oldNet) => {
    if (oldNet) {
      console.debug(`🔄 Network switch: ${oldNet.chainId} → ${newNet.chainId}`);
    }
  });

  // 7) cache + return
  providerCache.set(chainId, provider);
  return provider;
}

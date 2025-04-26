// src/utils/getProviderForChain.js
"use client";

import { ethers } from "ethers";
import { ethersFallbackProviders } from "@/utils/fallbackRPCs";

/**
 * Grąžina JsonRpcProvider arba FallbackProvider pagal chainId.
 * Ateityje tiesiog papildyk `ethersFallbackProviders[NEW_CHAIN_ID] = [url1, url2, ...]`
 *
 * @param {string|number} chainIdOrName – grandinės ID arba string versija
 * @returns {ethers.JsonRpcProvider|ethers.FallbackProvider}
 */
export function getProviderForChain(chainIdOrName) {
  // 1) Normalizuojame į skaičių
  const chainId =
    typeof chainIdOrName === "string"
      ? parseInt(chainIdOrName, 10)
      : chainIdOrName;

  if (typeof chainId !== "number" || isNaN(chainId)) {
    throw new Error(`❌ Invalid chainId: ${chainIdOrName}`);
  }

  // 2) Traukiam visus URL'us iš konfigūracijos
  const urls = ethersFallbackProviders[chainId];
  if (!Array.isArray(urls) || urls.length === 0) {
    throw new Error(`❌ No RPC endpoints configured for chainId ${chainId}`);
  }

  // 3) Kuriam JsonRpcProvider kiekvienam URL
  const providers = urls.map((url) => new ethers.JsonRpcProvider(url, chainId));

  // 4) Jei vienas URL – grąžinam jį tiesiogiai
  if (providers.length === 1) {
    return providers[0];
  }

  // 5) Kitais atvejais – FallbackProvider su prioritetais
  //    priority = 0 pirmam, 1 antram, ...; weight = 1 visiems; stallTimeout = 200ms
  const fallbackConfigs = providers.map((provider, index) => ({
    provider,
    priority: index,
    weight: 1,
    stallTimeout: 200
  }));

  // 6) quorum = 1 → pakanka vieno gyvo provider'io atsakymo
  return new ethers.FallbackProvider(fallbackConfigs, /* quorum */ 1);
}

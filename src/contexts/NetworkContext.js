// src/contexts/NetworkContext.js
"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";

// ↔ numeric chain IDs for all your mainnets & testnets
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

// list of all valid friendly network keys
export const SUPPORTED_NETWORKS = Object.keys(CHAIN_NAME_TO_ID);

const STORAGE_KEY = "activeNetwork";

const NetworkContext = createContext({
  activeNetwork: SUPPORTED_NETWORKS[0],
  chainId:        CHAIN_NAME_TO_ID[SUPPORTED_NETWORKS[0]],
  switchNetwork:  () => {},
});

export const useNetwork = () => useContext(NetworkContext);

export function NetworkProvider({ children }) {
  const [activeNetwork, setActiveNetwork] = useState(SUPPORTED_NETWORKS[0]);
  const [initialized,   setInitialized]   = useState(false);

  // on mount, read from localStorage
  useEffect(() => {
    if (typeof window === "undefined") {
      setInitialized(true);
      return;
    }
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved && SUPPORTED_NETWORKS.includes(saved)) {
        setActiveNetwork(saved);
      }
    } catch (e) {
      console.warn("NetworkContext load failed:", e);
    } finally {
      setInitialized(true);
    }
  }, []);

  // persist changes
  useEffect(() => {
    if (!initialized || typeof window === "undefined") return;
    try {
      localStorage.setItem(STORAGE_KEY, activeNetwork);
    } catch (e) {
      console.warn("NetworkContext save failed:", e);
    }
  }, [initialized, activeNetwork]);

  // switch by friendly key (e.g. "mumbai", "optimism")
  const switchNetwork = useCallback((netKey) => {
    if (!SUPPORTED_NETWORKS.includes(netKey)) {
      console.warn(`NetworkContext: unsupported network "${netKey}"`);
      return;
    }
    setActiveNetwork((prev) => (prev !== netKey ? netKey : prev));
  }, []);

  // numeric chainId for ethers
  const chainId = CHAIN_NAME_TO_ID[activeNetwork] ?? null;

  return (
    <NetworkContext.Provider value={{ activeNetwork, chainId, switchNetwork }}>
      {children}
    </NetworkContext.Provider>
  );
}

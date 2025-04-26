// src/contexts/NetworkContext.js
"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";

// Mapping from our string keys to numeric chain IDs
const CHAIN_IDS = {
  eth:   1,
  matic: 137,
  bnb:   56,
  tbnb:  97,
  avax:  43114,
};

export const SUPPORTED_NETWORKS = Object.keys(CHAIN_IDS);
const STORAGE_KEY = "activeNetwork";

const NetworkContext = createContext({
  activeNetwork: "eth",
  chainId:        CHAIN_IDS["eth"],
  switchNetwork:  () => {},
});

export const useNetwork = () => useContext(NetworkContext);

export function NetworkProvider({ children }) {
  const [activeNetwork, setActiveNetwork] = useState("eth");
  const [initialized,   setInitialized]   = useState(false);

  // 1) On mount, load saved network from localStorage (if in browser)
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
    } catch (err) {
      console.warn("NetworkContext load error:", err);
    } finally {
      setInitialized(true);
    }
  }, []);

  // 2) Whenever activeNetwork changes (post-init), save it
  useEffect(() => {
    if (!initialized || typeof window === "undefined") return;
    try {
      localStorage.setItem(STORAGE_KEY, activeNetwork);
    } catch (err) {
      console.warn("NetworkContext save error:", err);
    }
  }, [initialized, activeNetwork]);

  // 3) Switch network, but only if supported
  const switchNetwork = useCallback((networkKey) => {
    if (!SUPPORTED_NETWORKS.includes(networkKey)) {
      console.warn(`NetworkContext: unsupported network "${networkKey}"`);
      return;
    }
    setActiveNetwork((prev) => (prev !== networkKey ? networkKey : prev));
  }, []);

  // 4) Derive numeric chainId
  const chainId = CHAIN_IDS[activeNetwork] ?? null;

  return (
    <NetworkContext.Provider value={{ activeNetwork, chainId, switchNetwork }}>
      {children}
    </NetworkContext.Provider>
  );
}

// src/contexts/NetworkContext.js
"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";

// our string keys ↔ numeric chainIds
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

  // load saved network
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
      console.warn("NetworkContext load:", e);
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
      console.warn("NetworkContext save:", e);
    }
  }, [initialized, activeNetwork]);

  const switchNetwork = useCallback((net) => {
    if (!SUPPORTED_NETWORKS.includes(net)) {
      console.warn(`unsupported network "${net}"`);
      return;
    }
    setActiveNetwork((prev) => (prev !== net ? net : prev));
  }, []);

  const chainId = CHAIN_IDS[activeNetwork] ?? null;

  return (
    <NetworkContext.Provider value={{ activeNetwork, chainId, switchNetwork }}>
      {children}
    </NetworkContext.Provider>
  );
}

"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import networks from "@/data/networks"; // mūsų bendras networks.js

const STORAGE_KEY = "activeNetwork";

// build valid keys and chainId map
const NETWORK_KEYS = [];
const NETWORK_ID_MAP = {};

for (const net of networks) {
  NETWORK_KEYS.push(net.value);
  NETWORK_ID_MAP[net.value] = net.chainId;

  if (net.testnet) {
    NETWORK_KEYS.push(net.testnet.value);
    NETWORK_ID_MAP[net.testnet.value] = net.testnet.chainId;
  }
}

const NetworkContext = createContext({
  activeNetwork: NETWORK_KEYS[0],
  chainId: NETWORK_ID_MAP[NETWORK_KEYS[0]],
  switchNetwork: () => {},
});

export const useNetwork = () => useContext(NetworkContext);

export function NetworkProvider({ children }) {
  const [activeNetwork, setActiveNetwork] = useState(NETWORK_KEYS[0]);
  const [initialized, setInitialized] = useState(false);

  // on mount, load from localStorage
  useEffect(() => {
    if (typeof window === "undefined") {
      setInitialized(true);
      return;
    }
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved && NETWORK_KEYS.includes(saved)) {
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

  const switchNetwork = useCallback((netKey) => {
    if (!NETWORK_KEYS.includes(netKey)) {
      console.warn(`NetworkContext: unsupported network "${netKey}"`);
      return;
    }
    setActiveNetwork((prev) => (prev !== netKey ? netKey : prev));
  }, []);

  const chainId = NETWORK_ID_MAP[activeNetwork] ?? null;

  return (
    <NetworkContext.Provider value={{ activeNetwork, chainId, switchNetwork }}>
      {children}
    </NetworkContext.Provider>
  );
}

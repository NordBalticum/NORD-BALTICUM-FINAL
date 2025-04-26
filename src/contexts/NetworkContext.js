"use client";

import { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import networks from "@/data/networks";

const STORAGE_KEY = "activeNetwork";

const NETWORK_KEYS = [];
const NETWORK_ID_MAP = {};

for (const net of networks) {
  if (net?.value && net?.chainId) {
    NETWORK_KEYS.push(net.value);
    NETWORK_ID_MAP[net.value] = net.chainId;
  }
  if (net?.testnet?.value && net?.testnet?.chainId) {
    NETWORK_KEYS.push(net.testnet.value);
    NETWORK_ID_MAP[net.testnet.value] = net.testnet.chainId;
  }
}

const DEFAULT_NETWORK = NETWORK_KEYS[0] ?? "eth";

const NetworkContext = createContext({
  activeNetwork: DEFAULT_NETWORK,
  chainId: NETWORK_ID_MAP[DEFAULT_NETWORK] ?? 1,
  switchNetwork: () => {},
});

export const useNetwork = () => useContext(NetworkContext);

export function NetworkProvider({ children }) {
  const [activeNetwork, setActiveNetwork] = useState(DEFAULT_NETWORK);
  const [hydrated, setHydrated] = useState(false);

  // Load saved network
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved && NETWORK_KEYS.includes(saved)) {
        setActiveNetwork(saved);
      }
    } catch (err) {
      console.warn("[NetworkContext] Could not load saved network:", err);
    } finally {
      setHydrated(true);
    }
  }, []);

  // Save on change
  useEffect(() => {
    if (!hydrated || typeof window === "undefined") return;
    try {
      localStorage.setItem(STORAGE_KEY, activeNetwork);
    } catch (err) {
      console.warn("[NetworkContext] Could not save active network:", err);
    }
  }, [hydrated, activeNetwork]);

  const switchNetwork = useCallback((netKey) => {
    if (!NETWORK_KEYS.includes(netKey)) {
      console.warn(`[NetworkContext] Invalid network key attempted: ${netKey}`);
      return;
    }
    setActiveNetwork(netKey);
  }, []);

  const chainId = useMemo(() => NETWORK_ID_MAP[activeNetwork] ?? null, [activeNetwork]);

  const value = useMemo(() => ({
    activeNetwork,
    chainId,
    switchNetwork,
  }), [activeNetwork, chainId, switchNetwork]);

  return (
    <NetworkContext.Provider value={value}>
      {children}
    </NetworkContext.Provider>
  );
}

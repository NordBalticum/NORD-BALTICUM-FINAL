"use client";

import { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import fallbackRPCs from "@/utils/fallbackRPCs";

const STORAGE_KEY = "activeNetwork";
const DEFAULT_NETWORK = "eth";

const NETWORK_KEYS = Object.keys(fallbackRPCs);
const NETWORK_ID_MAP = Object.fromEntries(NETWORK_KEYS.map(k => [k, fallbackRPCs[k].chainId]));

const NetworkContext = createContext({
  activeNetwork: DEFAULT_NETWORK,
  chainId: NETWORK_ID_MAP[DEFAULT_NETWORK] ?? 1,
  switchNetwork: () => {},
});

export const useNetwork = () => useContext(NetworkContext);

export function NetworkProvider({ children }) {
  const [activeNetwork, setActiveNetwork] = useState(DEFAULT_NETWORK);
  const [hydrated, setHydrated] = useState(false);

  // Initialize active network from localStorage if valid
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved && NETWORK_KEYS.includes(saved)) {
        setActiveNetwork(saved);
      }
    } catch (err) {
      console.warn("[NetworkContext] ⚠️ Could not load saved network:", err);
    } finally {
      setHydrated(true);
    }
  }, []);

  // Persist active network to localStorage
  useEffect(() => {
    if (!hydrated || typeof window === "undefined") return;
    try {
      localStorage.setItem(STORAGE_KEY, activeNetwork);
    } catch (err) {
      console.warn("[NetworkContext] ⚠️ Could not save active network:", err);
    }
  }, [hydrated, activeNetwork]);

  // Switch network logic
  const switchNetwork = useCallback((netKey) => {
    if (!NETWORK_KEYS.includes(netKey)) {
      console.warn(`[NetworkContext] ❌ Invalid network attempted: ${netKey}`);
      return;
    }
    if (netKey === activeNetwork) {
      console.info(`[NetworkContext] 🔄 ${netKey} already active, reloading context.`);
    }
    setActiveNetwork(netKey);
  }, [activeNetwork]);

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

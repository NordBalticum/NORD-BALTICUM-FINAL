"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";

// ✅ Palaikomi tinklai (susiję su RPC fallback palaikymu)
export const SUPPORTED_NETWORKS = ["eth", "bnb", "tbnb", "matic", "avax"];
const STORAGE_KEY = "activeNetwork";

const NetworkContext = createContext();
export const useNetwork = () => useContext(NetworkContext);

export function NetworkProvider({ children }) {
  const [activeNetwork, setActiveNetwork] = useState("bnb");
  const [initialized, setInitialized] = useState(false);

  // ✅ Load from localStorage
  useEffect(() => {
    if (typeof window === "undefined") return;

    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && SUPPORTED_NETWORKS.includes(saved)) {
      setActiveNetwork(saved);
    }

    setInitialized(true);
  }, []);

  // ✅ Save to localStorage
  useEffect(() => {
    if (!initialized || typeof window === "undefined") return;
    if (SUPPORTED_NETWORKS.includes(activeNetwork)) {
      localStorage.setItem(STORAGE_KEY, activeNetwork);
    }
  }, [activeNetwork, initialized]);

  // ✅ Pakeičia tinklą tik jeigu jis supported
  const switchNetwork = useCallback((network) => {
    if (!SUPPORTED_NETWORKS.includes(network)) return;
    setActiveNetwork((prev) => (prev !== network ? network : prev));
  }, []);

  return (
    <NetworkContext.Provider value={{ activeNetwork, switchNetwork }}>
      {children}
    </NetworkContext.Provider>
  );
}

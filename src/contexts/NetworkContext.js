"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";

export const SUPPORTED_NETWORKS = ["eth", "bnb", "tbnb", "matic", "avax"];

const NetworkContext = createContext();
export const useNetwork = () => useContext(NetworkContext);

const STORAGE_KEY = "activeNetwork";

export function NetworkProvider({ children }) {
  const [activeNetwork, setActiveNetwork] = useState("bnb");
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && SUPPORTED_NETWORKS.includes(saved)) {
      setActiveNetwork(saved);
    }
    setInitialized(true);
  }, []);

  useEffect(() => {
    if (!initialized || typeof window === "undefined") return;
    localStorage.setItem(STORAGE_KEY, activeNetwork);
  }, [activeNetwork, initialized]);

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

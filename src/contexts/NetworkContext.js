// src/contexts/NetworkContext.js
"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";

// ✅ Supported Networks
export const SUPPORTED_NETWORKS = ["eth", "bnb", "tbnb", "matic", "avax"];

export const NetworkContext = createContext();

export const useNetwork = () => useContext(NetworkContext);

export function NetworkProvider({ children }) {
  const [activeNetwork, setActiveNetwork] = useState("bnb"); // ✅ Default: BNB
  const [initialized, setInitialized] = useState(false); // ✅ Užtikrina, kad pirma loadintų iš LocalStorage

  // ✅ Užkrauna pasirinkimą iš LocalStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("activeNetwork");
      if (saved && SUPPORTED_NETWORKS.includes(saved)) {
        setActiveNetwork(saved);
      }
      setInitialized(true);
    }
  }, []);

  // ✅ Išsaugo į LocalStorage kai pasikeičia
  useEffect(() => {
    if (initialized && typeof window !== "undefined") {
      localStorage.setItem("activeNetwork", activeNetwork);
    }
  }, [activeNetwork, initialized]);

  // ✅ Premium set funkcija su saugumu
  const switchNetwork = useCallback((network) => {
    if (!SUPPORTED_NETWORKS.includes(network)) {
      console.warn(`❌ Attempted to switch to unsupported network: ${network}`);
      return;
    }
    setActiveNetwork(network);
  }, []);

  return (
    <NetworkContext.Provider value={{ activeNetwork, switchNetwork }}>
      {children}
    </NetworkContext.Provider>
  );
}

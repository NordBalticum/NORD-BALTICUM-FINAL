// src/contexts/NetworkContext.js
"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";

// Palaikomi tinklai (key sutampa su mūsų konfigūracijomis)
export const SUPPORTED_NETWORKS = ["eth", "bnb", "tbnb", "matic", "avax"];
const STORAGE_KEY = "activeNetwork";

const NetworkContext = createContext({
  activeNetwork: "bnb",
  switchNetwork: () => {},
});

export const useNetwork = () => useContext(NetworkContext);

export function NetworkProvider({ children }) {
  const [activeNetwork, setActiveNetwork] = useState("bnb");
  const [initialized, setInitialized] = useState(false);

  // Inicializuojame iš localStorage
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && SUPPORTED_NETWORKS.includes(saved)) {
      setActiveNetwork(saved);
    }
    setInitialized(true);
  }, []);

  // Išsaugome pasirinkimą localStorage
  useEffect(() => {
    if (!initialized) return;
    if (SUPPORTED_NETWORKS.includes(activeNetwork)) {
      localStorage.setItem(STORAGE_KEY, activeNetwork);
    }
  }, [activeNetwork, initialized]);

  // Tinklo keitimo funkcija
  const switchNetwork = useCallback((networkKey) => {
    if (!SUPPORTED_NETWORKS.includes(networkKey)) return;
    setActiveNetwork((prev) => (prev !== networkKey ? networkKey : prev));
  }, []);

  return (
    <NetworkContext.Provider value={{ activeNetwork, switchNetwork }}>
      {children}
    </NetworkContext.Provider>
  );
}

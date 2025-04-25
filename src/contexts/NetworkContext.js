// src/contexts/NetworkContext.js
"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";

// String → skaitinis chainId žemėlapis
const CHAIN_IDS = {
  eth: 1,
  matic: 137,
  bnb: 56,
  tbnb: 97,
  avax: 43114,
};

// Galimi raktai
export const SUPPORTED_NETWORKS = Object.keys(CHAIN_IDS);
const STORAGE_KEY = "activeNetwork";

// Sukuriame kontekstą su default reikšmėmis
const NetworkContext = createContext({
  activeNetwork: "eth",
  chainId: CHAIN_IDS["eth"],
  switchNetwork: () => {},
});

// Hook’as prie konteksto
export const useNetwork = () => useContext(NetworkContext);

// Provider’is
export function NetworkProvider({ children }) {
  const [activeNetwork, setActiveNetwork] = useState("eth");
  const [initialized, setInitialized] = useState(false);

  // 1) Pasiimame iš localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved && SUPPORTED_NETWORKS.includes(saved)) {
        setActiveNetwork(saved);
      }
    } catch (e) {
      console.warn("NetworkContext load error:", e);
    }
    setInitialized(true);
  }, []);

  // 2) Išsaugome į localStorage (tik po init)
  useEffect(() => {
    if (!initialized) return;
    try {
      localStorage.setItem(STORAGE_KEY, activeNetwork);
    } catch (e) {
      console.warn("NetworkContext save error:", e);
    }
  }, [initialized, activeNetwork]);

  // 3) Pakeitimo funkcija
  const switchNetwork = useCallback((networkKey) => {
    if (!SUPPORTED_NETWORKS.includes(networkKey)) {
      console.warn(`Unsupported network: ${networkKey}`);
      return;
    }
    setActiveNetwork((prev) => (prev !== networkKey ? networkKey : prev));
  }, []);

  // 4) Gauname skaitinį chainId
  const chainId = CHAIN_IDS[activeNetwork] ?? null;

  return (
    <NetworkContext.Provider value={{ activeNetwork, chainId, switchNetwork }}>
      {children}
    </NetworkContext.Provider>
  );
}

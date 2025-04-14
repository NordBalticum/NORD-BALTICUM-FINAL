// src/contexts/NetworkContext.js
"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";

// ✅ Supported Networks
export const SUPPORTED_NETWORKS = ["eth", "bnb", "tbnb", "matic", "avax"];

export const NetworkContext = createContext();

export const useNetwork = () => useContext(NetworkContext);

export function NetworkProvider({ children }) {
  const [activeNetwork, setActiveNetwork] = useState("bnb"); // ✅ Default: BNB
  const [initialized, setInitialized] = useState(false); // ✅ Užtikrinam pirmą kartą užkrovimą saugiai

  // ✅ Saugi LocalStorage read funkcija
  const safeGetLocalStorage = (key) => {
    try {
      if (typeof window !== "undefined") {
        return localStorage.getItem(key);
      }
    } catch (error) {
      console.error("❌ LocalStorage get error:", error.message);
      return null;
    }
  };

  // ✅ Saugi LocalStorage write funkcija
  const safeSetLocalStorage = (key, value) => {
    try {
      if (typeof window !== "undefined") {
        localStorage.setItem(key, value);
      }
    } catch (error) {
      console.error("❌ LocalStorage set error:", error.message);
    }
  };

  // ✅ Užkraunam pasirinktą tinklą iš LocalStorage
  useEffect(() => {
    const saved = safeGetLocalStorage("activeNetwork");
    if (saved && SUPPORTED_NETWORKS.includes(saved)) {
      setActiveNetwork(saved);
    }
    setInitialized(true);
  }, []);

  // ✅ Išsaugom kai aktyvus tinklas pasikeičia (tik po pirmo užkrovimo)
  useEffect(() => {
    if (initialized) {
      safeSetLocalStorage("activeNetwork", activeNetwork);
    }
  }, [activeNetwork, initialized]);

  // ✅ Saugi switchNetwork funkcija
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

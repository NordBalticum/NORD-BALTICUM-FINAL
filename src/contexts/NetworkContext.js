// src/contexts/NetworkContext.js
"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";

// ✅ Supported Networks
export const SUPPORTED_NETWORKS = ["eth", "bnb", "tbnb", "matic", "avax"];

const NetworkContext = createContext();
export const useNetwork = () => useContext(NetworkContext);

// ✅ LocalStorage Keys
const STORAGE_KEY = "activeNetwork";

export function NetworkProvider({ children }) {
  const [activeNetwork, setActiveNetwork] = useState("bnb"); // ✅ Default: BNB
  const [initialized, setInitialized] = useState(false);     // ✅ Tik pirmajam įkėlimui

  // ✅ Saugus LocalStorage reader
  const safeGetLocalStorage = (key) => {
    try {
      if (typeof window !== "undefined") {
        return localStorage.getItem(key);
      }
    } catch (err) {
      console.error("❌ LocalStorage read error:", err.message);
      return null;
    }
  };

  // ✅ Saugus LocalStorage writer
  const safeSetLocalStorage = (key, value) => {
    try {
      if (typeof window !== "undefined") {
        localStorage.setItem(key, value);
      }
    } catch (err) {
      console.error("❌ LocalStorage write error:", err.message);
    }
  };

  // ✅ Inicializuojam aktyvų tinklą
  useEffect(() => {
    const saved = safeGetLocalStorage(STORAGE_KEY);
    if (saved && SUPPORTED_NETWORKS.includes(saved)) {
      setActiveNetwork(saved);
      console.info(`✅ Loaded activeNetwork from localStorage: ${saved}`);
    } else {
      console.info(`ℹ️ No valid saved network, using default: bnb`);
    }
    setInitialized(true);
  }, []);

  // ✅ Saugojam aktyvų tinklą po pirmo inicijavimo
  useEffect(() => {
    if (!initialized) return;
    safeSetLocalStorage(STORAGE_KEY, activeNetwork);
    console.info(`✅ Saved activeNetwork: ${activeNetwork}`);
  }, [activeNetwork, initialized]);

  // ✅ Saugi tinklo keitimo funkcija
  const switchNetwork = useCallback((network) => {
    if (!SUPPORTED_NETWORKS.includes(network)) {
      console.warn(`❌ Unsupported network switch attempt: ${network}`);
      return;
    }

    setActiveNetwork((prev) => {
      if (prev !== network) {
        console.info(`🔀 Switching network: ${prev} → ${network}`);
        return network;
      }
      return prev;
    });
  }, []);

  return (
    <NetworkContext.Provider value={{ activeNetwork, switchNetwork }}>
      {children}
    </NetworkContext.Provider>
  );
}

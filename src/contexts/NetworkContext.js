"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useBalance } from "@/contexts/BalanceContext";

export const SUPPORTED_NETWORKS = ["eth", "bnb", "tbnb", "matic", "avax"];

const NetworkContext = createContext();
export const useNetwork = () => useContext(NetworkContext);

const STORAGE_KEY = "activeNetwork";

export function NetworkProvider({ children }) {
  const { refetch } = useBalance();

  const [activeNetwork, setActiveNetwork] = useState("bnb");
  const [initialized, setInitialized] = useState(false);
  const [isClient, setIsClient] = useState(false); // SSR apsauga

  // ✅ Set flag on client
  useEffect(() => {
    setIsClient(true);
  }, []);

  // ✅ Inicializuojam aktyvų tinklą tik kliento pusėje
  useEffect(() => {
    if (!isClient) return;

    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved && SUPPORTED_NETWORKS.includes(saved)) {
        setActiveNetwork(saved);
        console.info(`✅ Loaded activeNetwork from localStorage: ${saved}`);
      } else {
        console.info(`ℹ️ No valid saved network, using default: bnb`);
      }
    } catch (err) {
      console.warn("❌ NetworkContext localStorage read error:", err.message);
    }

    setInitialized(true);
  }, [isClient]);

  // ✅ Saugojam aktyvų tinklą
  useEffect(() => {
    if (!initialized || !isClient) return;

    try {
      localStorage.setItem(STORAGE_KEY, activeNetwork);
      console.info(`✅ Saved activeNetwork: ${activeNetwork}`);
    } catch (err) {
      console.warn("❌ NetworkContext localStorage write error:", err.message);
    }
  }, [activeNetwork, initialized, isClient]);

  // ✅ Switch network
  const switchNetwork = useCallback((network) => {
    if (!SUPPORTED_NETWORKS.includes(network)) {
      console.warn(`❌ Unsupported network switch attempt: ${network}`);
      return;
    }

    setActiveNetwork((prev) => {
      if (prev !== network) {
        console.info(`🔀 Switching network: ${prev} → ${network}`);
        setTimeout(() => {
          try {
            refetch?.();
            console.info("✅ Auto-refetch after network switch.");
          } catch (err) {
            console.warn("⚠️ Auto-refetch failed:", err.message);
          }
        }, 250);
        return network;
      }
      return prev;
    });
  }, [refetch]);

  return (
    <NetworkContext.Provider value={{ activeNetwork, switchNetwork }}>
      {children}
    </NetworkContext.Provider>
  );
}

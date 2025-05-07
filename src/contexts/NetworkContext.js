"use client";

// ============================================
// 🌐 NetworkContext.js — NORD BALTICUM V1 (DIAMOND FINAL LOCKED VERSION)
// ============================================

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";

import fallbackRPCs from "@/utils/fallbackRPCs";

// ============================================
// ⚙️ Konstanta: LocalStorage Key
// ============================================
const STORAGE_KEY = "activeNetwork";

// ✅ Numatyta pradžios būsena
const DEFAULT_NETWORK = "eth";

// ✅ Galimi tinklų raktai (pvz., eth, polygon, bnb...)
const NETWORK_KEYS = Object.keys(fallbackRPCs);

// ✅ Greitas mapping: network → chainId
const NETWORK_ID_MAP = Object.fromEntries(
  NETWORK_KEYS.map(key => [key, fallbackRPCs[key].chainId])
);

// ✅ Atvirkštinis mapping: chainId → network
const CHAINID_TO_NETWORK = Object.fromEntries(
  NETWORK_KEYS.map(key => [fallbackRPCs[key].chainId, key])
);

// ============================================
// 📦 Konteksto inicializavimas
// ============================================
const NetworkContext = createContext({
  activeNetwork: DEFAULT_NETWORK,
  chainId: NETWORK_ID_MAP[DEFAULT_NETWORK] ?? 1,
  chainLabel: fallbackRPCs[DEFAULT_NETWORK]?.label ?? "Ethereum",
  hydrated: false,
  switchNetwork: () => {},
  switchNetworkSafe: async () => {},
  isSupportedNetwork: () => false,
});

export const useNetwork = () => useContext(NetworkContext);

// ============================================
// 🚀 NetworkProvider – Metamask-grade + SSR safe
// ============================================
export function NetworkProvider({ children }) {
  const [activeNetwork, setActiveNetwork] = useState(DEFAULT_NETWORK);
  const [hydrated, setHydrated] = useState(false);

  // 🧠 LocalStorage inicializavimas
  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const stored = localStorage.getItem(STORAGE_KEY);

      if (stored && NETWORK_KEYS.includes(stored)) {
        setActiveNetwork(stored);
      } else {
        localStorage.setItem(STORAGE_KEY, DEFAULT_NETWORK);
      }
    } catch (err) {
      console.warn("[NetworkContext] ⚠️ Failed to read localStorage:", err);
    } finally {
      setHydrated(true);
    }
  }, []);

  // 💾 Įrašom aktyvų tinklą į localStorage kai jis pasikeičia
  useEffect(() => {
    if (!hydrated || typeof window === "undefined") return;

    try {
      localStorage.setItem(STORAGE_KEY, activeNetwork);
    } catch (err) {
      console.warn("[NetworkContext] ⚠️ Failed to write localStorage:", err);
    }
  }, [hydrated, activeNetwork]);

  // ============================================
  // 🔁 Tinklo keitimas: tik jei validus
  // ============================================
  const switchNetwork = useCallback((netKey) => {
    if (!NETWORK_KEYS.includes(netKey)) {
      console.error(`[NetworkContext] ❌ Unsupported network: ${netKey}`);
      return;
    }
    if (netKey === activeNetwork) {
      console.info(`[NetworkContext] ⏸️ Network '${netKey}' already active`);
      return;
    }

    console.log(`[NetworkContext] 🔄 Switching to: ${netKey}`);
    setActiveNetwork(netKey);
  }, [activeNetwork]);

  // ✅ Async saugus perjungimas (naudojimui iš UI)
  const switchNetworkSafe = useCallback(async (netKey) => {
    try {
      if (!NETWORK_KEYS.includes(netKey)) throw new Error("Unsupported network");
      if (netKey === activeNetwork) return;
      setActiveNetwork(netKey);
    } catch (err) {
      console.warn("[NetworkContext] switchNetworkSafe error:", err.message);
    }
  }, [activeNetwork]);

  // ✅ Ar tinklas palaikomas
  const isSupportedNetwork = useCallback((netKey) => NETWORK_KEYS.includes(netKey), []);

  // 📡 chainId ir label per useMemo
  const chainId = useMemo(() => NETWORK_ID_MAP[activeNetwork] ?? 1, [activeNetwork]);
  const chainLabel = useMemo(() => fallbackRPCs[activeNetwork]?.label || "Unknown", [activeNetwork]);

  // 💎 Grąžinamos konteksto reikšmės
  const value = useMemo(() => ({
    activeNetwork,
    chainId,
    chainLabel,
    hydrated,
    switchNetwork,
    switchNetworkSafe,
    isSupportedNetwork,
  }), [activeNetwork, chainId, chainLabel, hydrated, switchNetwork, switchNetworkSafe]);

  return (
    <NetworkContext.Provider value={value}>
      {children}
    </NetworkContext.Provider>
  );
}

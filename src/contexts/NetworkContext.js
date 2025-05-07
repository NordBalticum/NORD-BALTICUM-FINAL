"use client";

// ============================================
// 🌐 NetworkContext.js – FINAL META+ DIAMOND VERSION
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

// 🔐 LocalStorage raktas
const STORAGE_KEY = "activeNetwork";

// 🌐 Numatyto tinklo vertė (ETH)
const DEFAULT_NETWORK = "eth";

// ✅ Galimi tinklų ID pagal fallbackRPCs
const NETWORK_KEYS = Object.keys(fallbackRPCs);

// 🔁 Tinklo -> chainId mapping
const NETWORK_ID_MAP = Object.fromEntries(
  NETWORK_KEYS.map(key => [key, fallbackRPCs[key].chainId])
);

// 📦 Sukuriam kontekstą su defaultais
const NetworkContext = createContext({
  activeNetwork: DEFAULT_NETWORK,
  chainId: NETWORK_ID_MAP[DEFAULT_NETWORK] ?? 1,
  switchNetwork: () => {},
});

export const useNetwork = () => useContext(NetworkContext);

// ============================================
// 🚀 NetworkProvider – 100% SSR Safe + MetaMask logic
// ============================================
export function NetworkProvider({ children }) {
  const [activeNetwork, setActiveNetwork] = useState(DEFAULT_NETWORK);
  const [hydrated, setHydrated] = useState(false);

  // 🧠 Pirmą kartą užkraunam aktyvų tinklą iš localStorage
  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const saved = localStorage.getItem(STORAGE_KEY);

      if (saved && NETWORK_KEYS.includes(saved)) {
        setActiveNetwork(saved);
      } else {
        localStorage.setItem(STORAGE_KEY, DEFAULT_NETWORK);
      }
    } catch (err) {
      console.warn("[NetworkContext] ⚠️ Failed to load from localStorage:", err);
    } finally {
      setHydrated(true);
    }
  }, []);

  // 💾 Kai pasikeičia tinklas – išsaugom į localStorage
  useEffect(() => {
    if (!hydrated || typeof window === "undefined") return;

    try {
      localStorage.setItem(STORAGE_KEY, activeNetwork);
    } catch (err) {
      console.warn("[NetworkContext] ⚠️ Failed to save to localStorage:", err);
    }
  }, [hydrated, activeNetwork]);

  // 🔄 Funkcija keisti aktyvų tinklą (tik jei validus)
  const switchNetwork = useCallback(
    (netKey) => {
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
    },
    [activeNetwork]
  );

  // 📡 chainId grąžinamas pagal pasirinkimą
  const chainId = useMemo(
    () => NETWORK_ID_MAP[activeNetwork] ?? null,
    [activeNetwork]
  );

  // 💎 Konteksto reikšmės
  const value = useMemo(
    () => ({
      activeNetwork,
      chainId,
      switchNetwork,
    }),
    [activeNetwork, chainId, switchNetwork]
  );

  return (
    <NetworkContext.Provider value={value}>
      {children}
    </NetworkContext.Provider>
  );
}

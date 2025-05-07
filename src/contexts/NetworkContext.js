"use client";

// =======================================
// 🌐 NetworkContext.js – FINAL V1 META-GRADE
// =======================================

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";

import fallbackRPCs from "@/utils/fallbackRPCs";

// 🔑 LocalStorage key
const STORAGE_KEY = "activeNetwork";

// 🎯 Numatyta vertė – Ethereum mainnet
const DEFAULT_NETWORK = "eth";

// ✅ Palaikomi tinklai iš fallbackRPCs
const NETWORK_KEYS = Object.keys(fallbackRPCs);

// 🔁 Mappinam tinklų pavadinimus į chainId
const NETWORK_ID_MAP = Object.fromEntries(
  NETWORK_KEYS.map((key) => [key, fallbackRPCs[key].chainId])
);

// 📦 Konteksto sukūrimas
const NetworkContext = createContext({
  activeNetwork: DEFAULT_NETWORK,
  chainId: NETWORK_ID_MAP[DEFAULT_NETWORK] ?? 1,
  switchNetwork: () => {},
});

// 🧠 Hook'as komponentams naudoti kontekstą
export const useNetwork = () => useContext(NetworkContext);

// =======================================
// 🚀 Konteksto Provider komponentas
// =======================================
export function NetworkProvider({ children }) {
  // 🔧 Aktyvus tinklas (eth, bnb, matic ir t.t.)
  const [activeNetwork, setActiveNetwork] = useState(DEFAULT_NETWORK);

  // ✅ Ar localStorage užkrautas
  const [hydrated, setHydrated] = useState(false);

  // =======================================
  // 💾 useEffect: užkraunam localStorage išsaugotą tinklą
  // =======================================
  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved && NETWORK_KEYS.includes(saved)) {
        setActiveNetwork(saved);
      } else {
        // Jei localStorage yra netinkamas raktas, atstatom default'ą
        localStorage.setItem(STORAGE_KEY, DEFAULT_NETWORK);
      }
    } catch (err) {
      console.warn("[NetworkContext] ⚠️ Nepavyko gauti iš localStorage:", err);
    } finally {
      setHydrated(true);
    }
  }, []);

  // =======================================
  // 💽 useEffect: Išsaugom aktyvų tinklą į localStorage
  // =======================================
  useEffect(() => {
    if (!hydrated || typeof window === "undefined") return;

    try {
      localStorage.setItem(STORAGE_KEY, activeNetwork);
    } catch (err) {
      console.warn("[NetworkContext] ⚠️ Nepavyko išsaugoti į localStorage:", err);
    }
  }, [hydrated, activeNetwork]);

  // =======================================
  // 🔁 switchNetwork: Pakeičiam aktyvų tinklą
  // =======================================
  const switchNetwork = useCallback(
    (netKey) => {
      if (!NETWORK_KEYS.includes(netKey)) {
        console.warn(`[NetworkContext] ❌ Nepalaikomas tinklas: ${netKey}`);
        return;
      }
      if (netKey === activeNetwork) {
        console.info(`[NetworkContext] 🔄 Tinklas '${netKey}' jau aktyvus`);
      }
      setActiveNetwork(netKey);
    },
    [activeNetwork]
  );

  // 📟 Grąžinam current chainId pagal pasirinkimą
  const chainId = useMemo(
    () => NETWORK_ID_MAP[activeNetwork] ?? null,
    [activeNetwork]
  );

  // 📤 Viskas, ką kontekstas perduoda į sistemą
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

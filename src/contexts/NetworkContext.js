"use client";

// ============================================
// 🌐 NetworkContext.js — DIAMOND FINAL ERC20-READY VERSION
// ============================================

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";

import networks, {
  getNetworkByValue,
  getAllChainIds,
} from "@/data/networks";

// ============================================
// ⚙️ Konstanta: LocalStorage Key
// ============================================
const STORAGE_KEY = "activeNetwork";

// ✅ Pradinis tinklas
const DEFAULT_NETWORK = "eth";

// ✅ Galimi tinklai (pvz., eth, polygon...)
const NETWORK_KEYS = networks.map(n => n.value)
  .concat(networks.map(n => n.testnet?.value).filter(Boolean));

// ✅ Map: value → chainId
const NETWORK_ID_MAP = Object.fromEntries(
  networks.flatMap(n => [
    [n.value, n.chainId],
    ...(n.testnet ? [[n.testnet.value, n.testnet.chainId]] : []),
  ])
);

// ============================================
// 📦 Konteksto inicializavimas
// ============================================
const NetworkContext = createContext({
  activeNetwork: DEFAULT_NETWORK,
  chainId: NETWORK_ID_MAP[DEFAULT_NETWORK] ?? 1,
  chainLabel: getNetworkByValue(DEFAULT_NETWORK)?.label ?? "Ethereum",
  hydrated: false,
  switchNetwork: () => {},
  switchNetworkSafe: async () => {},
  isSupportedNetwork: () => false,
  activeToken: "native",
  tokenSymbol: "ETH",
  tokenAddress: null,
});

export const useNetwork = () => useContext(NetworkContext);

// ============================================
// 🚀 NetworkProvider — MetaMask-grade, ERC20-ready, SSR-safe
// ============================================
export function NetworkProvider({ children }) {
  const [activeNetwork, setActiveNetwork] = useState(DEFAULT_NETWORK);
  const [hydrated, setHydrated] = useState(false);

  // 🧠 LocalStorage: inicializacija
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
      console.warn("[NetworkContext] ⚠️ Nepavyko perskaityti localStorage:", err);
    } finally {
      setHydrated(true);
    }
  }, []);

  // 💾 LocalStorage: įrašom kai keičiasi
  useEffect(() => {
    if (!hydrated || typeof window === "undefined") return;
    try {
      localStorage.setItem(STORAGE_KEY, activeNetwork);
    } catch (err) {
      console.warn("[NetworkContext] ⚠️ Nepavyko įrašyti į localStorage:", err);
    }
  }, [hydrated, activeNetwork]);

  // ============================================
  // 🔁 Tinklo keitimas
  // ============================================
  const switchNetwork = useCallback((netKey) => {
    if (!NETWORK_KEYS.includes(netKey)) {
      console.error(`[NetworkContext] ❌ Nepalaikomas tinklas: ${netKey}`);
      return;
    }
    if (netKey === activeNetwork) {
      console.info(`[NetworkContext] ⏸️ Jau aktyvus: ${netKey}`);
      return;
    }
    console.log(`[NetworkContext] 🔄 Keičiamas tinklas į: ${netKey}`);
    setActiveNetwork(netKey);
  }, [activeNetwork]);

  const switchNetworkSafe = useCallback(async (netKey) => {
    try {
      if (!NETWORK_KEYS.includes(netKey)) throw new Error("Nepalaikomas tinklas");
      if (netKey === activeNetwork) return;
      setActiveNetwork(netKey);
    } catch (err) {
      console.warn("[NetworkContext] switchNetworkSafe klaida:", err.message);
    }
  }, [activeNetwork]);

  const isSupportedNetwork = useCallback(
    (netKey) => NETWORK_KEYS.includes(netKey),
    []
  );

  const netObj = useMemo(() => getNetworkByValue(activeNetwork), [activeNetwork]);
  const chainId = useMemo(() => NETWORK_ID_MAP[activeNetwork] ?? 1, [activeNetwork]);
  const chainLabel = useMemo(() => netObj?.label || "Unknown", [netObj]);

  // ✅ ERC20 arba native token info
  const tokenSymbol = netObj?.erc20?.symbol || netObj?.nativeSymbol || "ETH";
  const tokenAddress = netObj?.erc20?.address || null;
  const activeToken = tokenAddress ? "erc20" : "native";

  // ✅ Finalinė reikšmė
  const value = useMemo(() => ({
    activeNetwork,
    chainId,
    chainLabel,
    hydrated,
    switchNetwork,
    switchNetworkSafe,
    isSupportedNetwork,
    activeToken,
    tokenSymbol,
    tokenAddress,
  }), [
    activeNetwork,
    chainId,
    chainLabel,
    hydrated,
    switchNetwork,
    switchNetworkSafe,
    isSupportedNetwork,
    activeToken,
    tokenSymbol,
    tokenAddress,
  ]);

  return (
    <NetworkContext.Provider value={value}>
      {children}
    </NetworkContext.Provider>
  );
}

"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback
} from "react";

// Supported keys → on‐chain chainIds
const NETWORK_CHAIN_IDS = {
  eth: 1,
  matic: 137,
  bnb: 56,
  tbnb: 97,
  avax: 43114,
};

export const SUPPORTED_NETWORKS = Object.keys(NETWORK_CHAIN_IDS);
const STORAGE_KEY = "activeNetwork";

const NetworkContext = createContext({
  activeNetwork: "eth",
  chainId: null,
  switchNetwork: () => {},
});

export const useNetwork = () => useContext(NetworkContext);

export function NetworkProvider({ children }) {
  const [activeNetwork, setActiveNetwork] = useState("eth");
  const [initialized, setInitialized] = useState(false);

  // on load, read from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && SUPPORTED_NETWORKS.includes(saved)) {
      setActiveNetwork(saved);
    }
    setInitialized(true);
  }, []);

  // save changes
  useEffect(() => {
    if (!initialized) return;
    localStorage.setItem(STORAGE_KEY, activeNetwork);
  }, [activeNetwork, initialized]);

  const switchNetwork = useCallback((networkKey) => {
    if (!SUPPORTED_NETWORKS.includes(networkKey)) return;
    setActiveNetwork(networkKey);
  }, []);

  const chainId = NETWORK_CHAIN_IDS[activeNetwork] || null;

  return (
    <NetworkContext.Provider
      value={{ activeNetwork, chainId, switchNetwork }}
    >
      {children}
    </NetworkContext.Provider>
  );
}

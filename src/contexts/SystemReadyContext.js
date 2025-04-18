"use client";

import { createContext, useContext } from "react";
import { useSystemReady } from "@/hooks/useSystemReady";  // Importuojame mūsų hook'ą

const SystemReadyContext = createContext(null);

export function SystemReadyProvider({ children }) {
  const systemReady = useSystemReady();  // Gauname pasiruošimo duomenis iš hook'o

  return (
    <SystemReadyContext.Provider value={systemReady}>
      {children}
    </SystemReadyContext.Provider>
  );
}

export function useSystemReadyContext() {
  const context = useContext(SystemReadyContext);

  if (!context) {
    throw new Error("useSystemReadyContext must be used within SystemReadyProvider");
  }

  return context;
}

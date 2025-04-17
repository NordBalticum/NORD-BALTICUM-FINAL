// src/contexts/SystemReadyContext.js
"use client";

import { createContext, useContext } from "react";
import { useSystemReady as useSystemReadyHook } from "@/hooks/useSystemReady";

const SystemReadyContext = createContext(null);

export function SystemReadyProvider({ children }) {
  const state = useSystemReadyHook();
  return (
    <SystemReadyContext.Provider value={state}>
      {children}
    </SystemReadyContext.Provider>
  );
}

export function useSystemReady() {
  const ctx = useContext(SystemReadyContext);
  if (!ctx) {
    throw new Error("useSystemReady must be used within <SystemReadyProvider>");
  }
  return ctx;
}

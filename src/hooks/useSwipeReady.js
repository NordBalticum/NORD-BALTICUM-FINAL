"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect } from "react";

/**
 * ULTRA-ULTIMATE SwipeSelector readiness hook
 * 
 * @returns {boolean} - Ar SwipeSelector yra 100% stabiliai paruoštas
 */
export function useSwipeReady() {
  const { activeNetwork, setActiveNetwork } = useAuth();
  const [isClient, setIsClient] = useState(false);
  const [hasInitialized, setHasInitialized] = useState(false);
  const [delayedReady, setDelayedReady] = useState(false);

  // Patikrinam ar esam naršyklėje
  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsClient(true);
    }
  }, []);

  // Inicializacija kai visi dependency paruošti
  useEffect(() => {
    if (isClient && activeNetwork && typeof setActiveNetwork === "function") {
      setHasInitialized(true);
    }
  }, [isClient, activeNetwork, setActiveNetwork]);

  // Stabilumo delay (~150ms) kai ready
  useEffect(() => {
    if (hasInitialized) {
      const timer = setTimeout(() => {
        setDelayedReady(true);
      }, 150); 

      return () => clearTimeout(timer);
    }
  }, [hasInitialized]);

  const isSwipeReady =
    isClient &&
    !!activeNetwork &&
    typeof setActiveNetwork === "function" &&
    hasInitialized &&
    delayedReady;

  return isSwipeReady;
}

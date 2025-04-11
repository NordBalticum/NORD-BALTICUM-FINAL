"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect } from "react";

/**
 * ULTRA-ULTIMATE SwipeSelector readiness hook
 * - Užtikrina, kad SwipeSelector būtų 100% paruoštas su AuthContext
 */
export function useSwipeReady() {
  const { activeNetwork, setActiveNetwork } = useAuth();

  const [isClient, setIsClient] = useState(false);
  const [hasInitialized, setHasInitialized] = useState(false);
  const [delayedReady, setDelayedReady] = useState(false);

  // ✅ Patikrinam ar esam naršyklėj
  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsClient(true);
    }
  }, []);

  // ✅ Kai tik AuthContext pasiruošęs
  useEffect(() => {
    if (isClient && activeNetwork && typeof setActiveNetwork === "function") {
      setHasInitialized(true);
    }
  }, [isClient, activeNetwork, setActiveNetwork]);

  // ✅ Mažas saugus delay užtikrintam užsikrovimui
  useEffect(() => {
    if (hasInitialized) {
      const timer = setTimeout(() => {
        setDelayedReady(true);
      }, 150); // 150ms premium delay
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

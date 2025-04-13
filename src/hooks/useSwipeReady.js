"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useNetwork } from "@/contexts/NetworkContext"; // ✅ Naujas importas
import { useState, useEffect } from "react";

/**
 * ULTRA-ULTIMATE SwipeSelector readiness hook
 * - Užtikrina, kad SwipeSelector būtų 100% paruoštas su AuthContext + NetworkContext
 */
export function useSwipeReady() {
  const { user, authLoading, walletLoading } = useAuth();
  const { activeNetwork, setActiveNetwork } = useNetwork(); // ✅ Imame tinklą iš NetworkContext

  const [isClient, setIsClient] = useState(false);
  const [hasInitialized, setHasInitialized] = useState(false);
  const [delayedReady, setDelayedReady] = useState(false);

  // ✅ Patikrinam ar esam naršyklėje
  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsClient(true);
    }
  }, []);

  // ✅ Kai AuthContext + NetworkContext paruošti
  useEffect(() => {
    if (
      isClient &&
      !authLoading &&
      !walletLoading &&
      user &&
      activeNetwork &&
      typeof setActiveNetwork === "function"
    ) {
      setHasInitialized(true);
    }
  }, [isClient, authLoading, walletLoading, user, activeNetwork, setActiveNetwork]);

  // ✅ Mažas saugus delay
  useEffect(() => {
    if (hasInitialized) {
      const timer = setTimeout(() => {
        setDelayedReady(true);
      }, 150); // Premium delay
      return () => clearTimeout(timer);
    }
  }, [hasInitialized]);

  // ✅ Swipe paruošimo statusas
  const isSwipeReady =
    isClient &&
    !!user &&
    !!activeNetwork &&
    typeof setActiveNetwork === "function" &&
    hasInitialized &&
    delayedReady;

  return isSwipeReady;
}

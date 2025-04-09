"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect } from "react";

/**
 * ULTRA-ULTIMATE SwipeSelector readiness hook
 */
export function useSwipeReady() {
  const { activeNetwork, setActiveNetwork } = useAuth();
  const [isClient, setIsClient] = useState(false);
  const [hasInitialized, setHasInitialized] = useState(false);
  const [delayedReady, setDelayedReady] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsClient(true);
    }
  }, []);

  useEffect(() => {
    if (isClient && activeNetwork && typeof setActiveNetwork === "function") {
      setHasInitialized(true);
    }
  }, [isClient, activeNetwork, setActiveNetwork]);

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

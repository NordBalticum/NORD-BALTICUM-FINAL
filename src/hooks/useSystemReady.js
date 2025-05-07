// src/hooks/useSystemReady.js
"use client";

import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNetwork } from "@/contexts/NetworkContext";
import { detectIsMobile } from "@/utils/detectIsMobile";

export function useSystemReady() {
  const [domReady, setDomReady] = useState(false);
  const [pollCount, setPollCount] = useState(0);

  const { user, wallet, authLoading, walletLoading } = useAuth();
  const { activeNetwork, chainId } = useNetwork();

  // Device detection with extra fallback
  const deviceInfo = useMemo(() => {
    const isMobile = detectIsMobile();
    return {
      isMobile,
      isTablet: false,
      isDesktop: !isMobile,
      scale: isMobile ? 0.95 : 1,
      connectionType: typeof navigator !== "undefined"
        ? (navigator.connection?.effectiveType || "unknown")
        : "unknown",
    };
  }, []);

  // DOM ready check
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (document.readyState === "complete") {
      setDomReady(true);
    } else {
      const onLoad = () => setDomReady(true);
      window.addEventListener("load", onLoad);
      return () => window.removeEventListener("load", onLoad);
    }
  }, []);

  // Auth readiness logic
  const authReady = useMemo(() => {
    return (
      !authLoading &&
      !walletLoading &&
      !!user?.email &&
      !!wallet?.wallet?.address
    );
  }, [authLoading, walletLoading, user, wallet]);

  // Network readiness logic
  const networkReady = useMemo(() => {
    return !!activeNetwork && !!chainId;
  }, [activeNetwork, chainId]);

  // Retry polling (kas 1s iki 10 kartų, jei neparuoštas)
  useEffect(() => {
    if (authReady && networkReady && domReady) return;

    if (pollCount >= 10) return;

    const retry = setTimeout(() => {
      setPollCount((prev) => prev + 1);
    }, 1000);

    return () => clearTimeout(retry);
  }, [authReady, networkReady, domReady, pollCount]);

  const systemReady = useMemo(() => {
    return authReady && networkReady && domReady;
  }, [authReady, networkReady, domReady]);

  return {
    ready: systemReady,
    loading: !systemReady,
    isMobile: deviceInfo.isMobile,
    isTablet: deviceInfo.isTablet,
    isDesktop: deviceInfo.isDesktop,
    scale: deviceInfo.scale,
    connectionType: deviceInfo.connectionType,
    domReady,
    authReady,
    networkReady,
    retries: pollCount,
  };
}

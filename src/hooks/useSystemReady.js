// src/hooks/useSystemReady.js
"use client";

import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNetwork } from "@/contexts/NetworkContext";
import { detectIsMobile } from "@/utils/detectIsMobile"; // ✅ vietoj useDeviceInfo

export function useSystemReady() {
  const [domReady, setDomReady] = useState(false);

  const { user, wallet, authLoading, walletLoading } = useAuth();
  const { activeNetwork, chainId } = useNetwork();

  const deviceInfo = useMemo(() => {
    const isMobile = detectIsMobile();
    return {
      isMobile,
      isTablet: false,
      isDesktop: !isMobile,
      scale: isMobile ? 0.95 : 1,
      connectionType: navigator.connection?.effectiveType || "unknown",
    };
  }, []);

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

  const authReady = useMemo(() => {
    return (
      !authLoading &&
      !walletLoading &&
      !!user?.email &&
      !!wallet?.wallet?.address
    );
  }, [authLoading, walletLoading, user, wallet]);

  const networkReady = useMemo(() => {
    return !!activeNetwork && !!chainId;
  }, [activeNetwork, chainId]);

  const systemReady = useMemo(() => {
    return domReady && authReady && networkReady;
  }, [domReady, authReady, networkReady]);

- // ❌ ŠITĄ IŠTRINAM:
- // useSessionWatcher(); 

  return {
    ready: systemReady,
    loading: !systemReady,
    isMobile: deviceInfo.isMobile,
    isTablet: deviceInfo.isTablet,
    isDesktop: deviceInfo.isDesktop,
    scale: deviceInfo.scale,
    connectionType: deviceInfo.connectionType,
  };
}

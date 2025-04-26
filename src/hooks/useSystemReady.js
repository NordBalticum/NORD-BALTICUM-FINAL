// src/hooks/useSystemReady.js
"use client";

import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNetwork } from "@/contexts/NetworkContext";
import { useDeviceInfo } from "@/hooks/useDeviceInfo";
import { useSessionWatcher } from "@/hooks/sessionWatcher"; // 🔥 Naujas Watcher import

export function useSystemReady() {
  const [domReady, setDomReady] = useState(false);

  const { user, wallet, authLoading, walletLoading } = useAuth();
  const { activeNetwork, chainId } = useNetwork();
  const deviceInfo = useDeviceInfo();

  // Detect DOM Ready
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

  // Basic auth + wallet ready
  const authReady = useMemo(() => {
    return (
      !authLoading &&
      !walletLoading &&
      !!user?.email &&
      !!wallet?.wallet?.address
    );
  }, [authLoading, walletLoading, user, wallet]);

  // Network ready
  const networkReady = useMemo(() => {
    return !!activeNetwork && !!chainId;
  }, [activeNetwork, chainId]);

  // Final system ready
  const systemReady = useMemo(() => {
    return domReady && authReady && networkReady;
  }, [domReady, authReady, networkReady]);

  // 🧠 Start sessionWatcher only when system ready
  useSessionWatcher();

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

// src/hooks/useSystemReady.js
"use client";

import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNetwork } from "@/contexts/NetworkContext";
import { useBalance } from "@/contexts/BalanceContext";

import { useSessionWatcher } from "@/utils/sessionWatcher"; // ✅ Watcher
import { startSilentBalanceRefetch } from "@/utils/silentBalanceRefetch"; // ✅ Silent refetch
import { detectIsMobile } from "@/utils/detectIsMobile"; // ✅ Device detection utils

export function useSystemReady() {
  const [domReady, setDomReady] = useState(false);

  const { user, wallet, authLoading, walletLoading } = useAuth();
  const { activeNetwork, chainId } = useNetwork();
  const { refetch } = useBalance();

  const deviceInfo = useMemo(() => detectIsMobile(), []); // ✅ Vieta useDeviceInfo()

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

  // Auth + Wallet Ready
  const authReady = useMemo(() => {
    return (
      !authLoading &&
      !walletLoading &&
      !!user?.email &&
      !!wallet?.wallet?.address
    );
  }, [authLoading, walletLoading, user, wallet]);

  // Network Ready
  const networkReady = useMemo(() => {
    return !!activeNetwork && !!chainId;
  }, [activeNetwork, chainId]);

  // System Fully Ready
  const systemReady = useMemo(() => {
    return domReady && authReady && networkReady;
  }, [domReady, authReady, networkReady]);

  // Start session watcher automatically
  useSessionWatcher(); // ✅ Čia nesustabdo nieko – saugu

  // Start silent balance refetch only when ready
  useEffect(() => {
    if (!systemReady) return;

    const stop = startSilentBalanceRefetch(refetch);

    return () => {
      if (stop) stop(); // sustabdom gražiai jei koks reload
    };
  }, [systemReady, refetch]);

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

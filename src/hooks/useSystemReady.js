// src/hooks/useSystemReady.js
"use client";

import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNetwork } from "@/contexts/NetworkContext";
import { detectIsMobile } from "@/utils/detectIsMobile";
import { ethers } from "ethers";

export function useSystemReady() {
  const [domReady, setDomReady] = useState(false);
  const [pollCount, setPollCount] = useState(0);

  const { user, wallet, authLoading, walletLoading } = useAuth();
  const { activeNetwork, chainId } = useNetwork();

  // ✅ Detektuojam įrenginį, jungtį, ir naršyklės aplinką
  const deviceInfo = useMemo(() => {
    const isMobile = detectIsMobile();
    return {
      isMobile,
      isTablet: false,
      isDesktop: !isMobile,
      scale: isMobile ? 0.95 : 1,
      connectionType:
        typeof navigator !== "undefined" && navigator?.connection
          ? navigator.connection.effectiveType || "unknown"
          : "unknown",
    };
  }, []);

  // ✅ DOM readiness saugiklis (naudojant SSR tikrinimą)
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

  // ✅ Auth pasiruošimas
  const authReady = useMemo(() => {
    return (
      !authLoading &&
      !walletLoading &&
      !!user?.email &&
      !!wallet?.wallet?.address
    );
  }, [authLoading, walletLoading, user, wallet]);

  // ✅ Tinklo readiness
  const networkReady = useMemo(() => {
    return !!activeNetwork && !!chainId;
  }, [activeNetwork, chainId]);

  // ✅ Automatinis polling'as jeigu kažkuris laukas nepasiruošęs (iki 10 kartų kas 1s)
  useEffect(() => {
    if (authReady && networkReady && domReady) return;
    if (pollCount >= 10) return;

    const retry = setTimeout(() => {
      setPollCount((prev) => prev + 1);
    }, 1000);

    return () => clearTimeout(retry);
  }, [authReady, networkReady, domReady, pollCount]);

  // ✅ Viso sistemos readiness rezultatas
  const systemReady = useMemo(() => {
    return (
      authReady &&
      networkReady &&
      domReady &&
      typeof window !== "undefined" &&
      typeof ethers !== "undefined"
    );
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

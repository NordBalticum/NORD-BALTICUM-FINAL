// src/hooks/useSystemReady.js
"use client";

import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNetwork } from "@/contexts/NetworkContext";
import { detectIsMobile } from "@/utils/detectIsMobile";
import { ethers } from "ethers";

// Max retry attempts during polling
const MAX_RETRIES = 10;
const POLL_DELAY_MS = 1000;

export function useSystemReady() {
  const [domReady, setDomReady] = useState(false);
  const [pollCount, setPollCount] = useState(0);

  const { user, wallet, authLoading, walletLoading } = useAuth();
  const { activeNetwork, chainId } = useNetwork();

  // ✅ Detekcija įrenginio savybių – mobilus / desktop / ryšio tipas
  const deviceInfo = useMemo(() => {
    const {
      isMobile,
      isTablet,
      isDesktop,
      scale,
      connectionType,
    } = detectIsMobile();

    return {
      isMobile,
      isTablet,
      isDesktop,
      scale,
      connectionType,
    };
  }, []);

  // ✅ DOM pilnai užsikrovęs (naudojant SSR fallbacką)
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleLoad = () => setDomReady(true);

    if (document.readyState === "complete") {
      setDomReady(true);
    } else {
      window.addEventListener("load", handleLoad);
      return () => window.removeEventListener("load", handleLoad);
    }
  }, []);

  // ✅ Autentifikacija ir wallet pasiruošęs
  const authReady = useMemo(() => {
    return (
      !authLoading &&
      !walletLoading &&
      !!user?.email &&
      !!wallet?.wallet?.address
    );
  }, [authLoading, walletLoading, user, wallet]);

  // ✅ Tinklo nustatymai (network + chainId)
  const networkReady = useMemo(() => {
    return !!activeNetwork && !!chainId;
  }, [activeNetwork, chainId]);

  // ✅ Automatinis polling jeigu kažkuri sistema vėluoja
  useEffect(() => {
    if (authReady && networkReady && domReady) return;
    if (pollCount >= MAX_RETRIES) return;

    const timeout = setTimeout(() => {
      setPollCount((prev) => prev + 1);
    }, POLL_DELAY_MS);

    return () => clearTimeout(timeout);
  }, [authReady, networkReady, domReady, pollCount]);

  // ✅ Visa sistema pasiruošus (visos sąlygos įvykdytos)
  const systemReady = useMemo(() => {
    return (
      typeof window !== "undefined" &&
      typeof ethers !== "undefined" &&
      authReady &&
      networkReady &&
      domReady
    );
  }, [authReady, networkReady, domReady]);

  return {
    ready: systemReady,
    loading: !systemReady,
    domReady,
    authReady,
    networkReady,
    retries: pollCount,
    isMobile: deviceInfo.isMobile,
    isTablet: deviceInfo.isTablet,
    isDesktop: deviceInfo.isDesktop,
    scale: deviceInfo.scale,
    connectionType: deviceInfo.connectionType,
  };
}

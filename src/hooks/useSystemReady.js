"use client";

import { useState, useEffect, useMemo } from "react";
import { ethers } from "ethers";
import { useAuth } from "@/contexts/AuthContext";
import { useNetwork } from "@/contexts/NetworkContext";
import { detectIsMobile } from "@/utils/detectIsMobile";

// Tikrinimų limitas per komponento gyvavimo ciklą
const MAX_RETRIES = 10;
const POLL_DELAY_MS = 1000;

export function useSystemReady() {
  const [domReady, setDomReady] = useState(false);
  const [pollCount, setPollCount] = useState(0);

  const { user, wallet, authLoading, walletLoading } = useAuth();
  const { activeNetwork, chainId } = useNetwork();

  // ✅ Įrenginio informacija: mobile, scale, ryšys
  const {
    isMobile,
    isTablet,
    isDesktop,
    scale,
    connectionType,
  } = useMemo(() => detectIsMobile(), []);

  // ✅ DOM readiness (SSR fallback)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const onReady = () => setDomReady(true);
    if (document.readyState === "complete") {
      onReady();
    } else {
      window.addEventListener("load", onReady);
      return () => window.removeEventListener("load", onReady);
    }
  }, []);

  // ✅ Auth readiness
  const authReady = useMemo(() => {
    return (
      !authLoading &&
      !walletLoading &&
      !!user?.email &&
      !!wallet?.wallet?.address &&
      Object.keys(wallet?.signers || {}).length > 0
    );
  }, [authLoading, walletLoading, user, wallet]);

  // ✅ Network readiness
  const networkReady = useMemo(() => {
    return !!activeNetwork && !!chainId;
  }, [activeNetwork, chainId]);

  // ✅ Retry/polling jei vėluoja readiness
  useEffect(() => {
    if (authReady && networkReady && domReady) return;
    if (pollCount >= MAX_RETRIES) return;

    const timeout = setTimeout(() => {
      setPollCount((prev) => prev + 1);
    }, POLL_DELAY_MS);

    return () => clearTimeout(timeout);
  }, [authReady, networkReady, domReady, pollCount]);

  // ✅ Galutinė readiness būsena
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
    isMobile,
    isTablet,
    isDesktop,
    scale,
    connectionType,
  };
}

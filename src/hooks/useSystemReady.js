"use client";

/**
 * useSystemReady v3.0 — Final MetaMask-Grade+
 * ============================================
 * • Tikrina: Auth + Wallet + Network + DOM readiness
 * • Integruotas retry/poll su smart limit
 * • Gražina: latency, retries, connection, įrenginį, ir refresh rekomendaciją
 */

import { useState, useEffect, useMemo, useRef } from "react";
import { ethers } from "ethers";
import { useAuth } from "@/contexts/AuthContext";
import { useNetwork } from "@/contexts/NetworkContext";
import { detectIsMobile } from "@/utils/detectIsMobile";

const MAX_RETRIES = 10;
const POLL_DELAY_MS = 1000;

export function useSystemReady() {
  const [domReady, setDomReady] = useState(false);
  const [pollCount, setPollCount] = useState(0);
  const [latencyMs, setLatencyMs] = useState(null);
  const startTimeRef = useRef(performance.now());

  const { user, wallet, authLoading, walletLoading } = useAuth();
  const { activeNetwork, chainId } = useNetwork();

  const {
    isMobile,
    isTablet,
    isDesktop,
    scale,
    connectionType: rawConnection,
  } = useMemo(() => detectIsMobile(), []);

  const connectionType = rawConnection || (typeof navigator !== "undefined" && navigator.onLine ? "online" : "offline");

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

  const authReady = useMemo(() => {
    return (
      !authLoading &&
      !walletLoading &&
      !!user?.email &&
      !!wallet?.wallet?.address &&
      Object.keys(wallet?.signers || {}).length > 0
    );
  }, [authLoading, walletLoading, user, wallet]);

  const networkReady = useMemo(() => {
    return !!activeNetwork && !!chainId;
  }, [activeNetwork, chainId]);

  const systemReady = useMemo(() => {
    return (
      typeof window !== "undefined" &&
      typeof ethers !== "undefined" &&
      domReady &&
      authReady &&
      networkReady
    );
  }, [domReady, authReady, networkReady]);

  useEffect(() => {
    if (!systemReady && pollCount < MAX_RETRIES) {
      const timeout = setTimeout(() => {
        setPollCount((prev) => prev + 1);
      }, POLL_DELAY_MS);
      return () => clearTimeout(timeout);
    } else if (systemReady && latencyMs === null) {
      const endTime = performance.now();
      setLatencyMs(Math.round(endTime - startTimeRef.current));
    }
  }, [systemReady, pollCount, latencyMs]);

  const refreshRecommended = useMemo(() => {
    return pollCount >= MAX_RETRIES && !systemReady;
  }, [pollCount, systemReady]);

  return {
    ready: systemReady,
    loading: !systemReady,
    domReady,
    authReady,
    networkReady,
    retries: pollCount,
    latencyMs,
    refreshRecommended,
    isMobile,
    isTablet,
    isDesktop,
    connectionType,
    scale,
  };
}

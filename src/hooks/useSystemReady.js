"use client";

/**
 * useSystemReady v3.2 — Final MetaMask-Grade+
 * ============================================
 * • Tikrina: Auth + Wallet + Network + DOM readiness
 * • Integruotas retry/poll su smart limit
 * • Grąžina: latency, retries, connection, įrenginį, ir refresh rekomendaciją
 * • Tobulas 24/7 hookas mobiliai ir desktop aplinkai
 */

import { useState, useEffect, useMemo, useRef } from "react";
import { ethers } from "ethers";
import { useAuth } from "@/contexts/AuthContext";
import { useNetwork } from "@/contexts/NetworkContext";
import { detectIsMobile } from "@/utils/detectIsMobile";

const MAX_RETRIES = 12; // Maximum number of retries before declaring the system as failed
const POLL_DELAY_MS = 1000; // Delay between polling attempts in milliseconds

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

  // DOM readiness check
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

  const hasWalletAddress = !!wallet?.wallet?.address;
  const hasSigner = Object.keys(wallet?.signers || {}).length > 0;

  const authReady = useMemo(() => {
    return (
      !authLoading &&
      !walletLoading &&
      !!user?.email &&
      hasWalletAddress &&
      hasSigner
    );
  }, [authLoading, walletLoading, user, hasWalletAddress, hasSigner]);

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

  // Polling for system readiness
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
    ready: systemReady, // Indicates if everything is ready for interaction
    loading: !systemReady, // Loading state while the system is not ready
    domReady, // Indicates if the DOM is ready for interaction
    authReady, // Indicates if Auth context is ready
    networkReady, // Indicates if Network context is ready
    retries: pollCount, // The number of polling attempts made so far
    latencyMs, // Latency in milliseconds, if available
    refreshRecommended, // If a refresh is recommended due to timeouts
    isMobile, // Whether the device is mobile
    isTablet, // Whether the device is a tablet
    isDesktop, // Whether the device is desktop
    connectionType, // Connection type ("online" or "offline")
    scale, // Scaling factor for responsive design
  };
}

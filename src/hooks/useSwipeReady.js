"use client";

import { useAuth } from "@/contexts/AuthContext";

export function useSwipeReady() {
  const { activeNetwork, setActiveNetwork } = useAuth();
  const isReady = !!activeNetwork && typeof setActiveNetwork === "function";
  return isReady;
}

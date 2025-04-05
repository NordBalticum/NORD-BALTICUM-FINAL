// src/hooks/useSwipeReady.js
"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect } from "react";

export function useSwipeReady() {
  const { activeNetwork, setActiveNetwork } = useAuth();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsClient(true);
    }
  }, []);

  const isReady =
    isClient &&
    !!activeNetwork &&
    typeof setActiveNetwork === "function";

  return isReady;
}

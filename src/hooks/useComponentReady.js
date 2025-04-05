"use client";

import { useState, useEffect } from "react";

/**
 * Universalus hook'as komponento readiness tikrinimui
 * @param {Object} checks - Objektas su loginiais tikrinimais
 * @returns {boolean} - Ar komponentas yra paruoštas
 */
export function useComponentReady(checks = {}) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsClient(true);
    }
  }, []);

  const allChecksPassed = Object.values(checks).every((check) => Boolean(check));

  return isClient && allChecksPassed;
}

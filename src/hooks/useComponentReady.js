"use client";

import { useState, useEffect } from "react";

/**
 * Universalus hook'as komponento readiness tikrinimui
 * Naudojamas bet kokiems komponentams, kurie turi priklausomybes
 * 
 * @param {Object} checks - Objektas su loginiais (truthy/falsy) tikrinimais
 * @returns {boolean} - Ar komponentas yra pilnai paruoštas
 */
export function useComponentReady(checks = {}) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsClient(true);
    }
  }, []);

  const allChecksPassed = Object.values(checks || {}).every(Boolean);

  return isClient && allChecksPassed;
}

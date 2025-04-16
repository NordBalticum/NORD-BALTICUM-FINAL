"use client";

import { useEffect, useState, useCallback } from "react";
import debounce from "lodash.debounce";

/**
 * useScale – Premium Responsive Scaling Hook
 * ==========================================
 * Automatiškai grąžina optimalų `scale` skaičių pagal:
 * - lango plotį (responsive)
 * - įrenginio orientaciją
 * - ekrano tankį (Retina/HDPI)
 * - user motion preferences
 * - SSR-safety
 *
 * Naudojama animacijose, transformuose ar layoutuose.
 * Tinka visam projektui: Dashboard, Onboarding, Wallet, Modals.
 */
export function useScale(initial = 0.92) {
  const [scale, setScale] = useState(initial);

  const updateScale = useCallback(() => {
    if (typeof window === "undefined") return;

    const width = window.innerWidth;
    const pixelRatio = window.devicePixelRatio || 1;
    const prefersReducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const isPortrait = window.matchMedia?.("(orientation: portrait)")?.matches;

    let newScale = initial;

    if (width < 468) {
      newScale = prefersReducedMotion ? 0.70 : 0.67;
    } else if (width < 768) {
      newScale = prefersReducedMotion ? 0.74 : 0.70;
    } else {
      newScale = prefersReducedMotion ? 0.96 : 0.99;
    }

    if (pixelRatio >= 2 && width < 480) {
      newScale -= 0.02; // Retina phones
    }

    if (isPortrait && width < 768) {
      newScale -= 0.01;
    }

    newScale = parseFloat(newScale.toFixed(4));
    setScale(newScale);
  }, [initial]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    updateScale(); // Init

    const debouncedResize = debounce(updateScale, 120);
    const orientationChange = () => setTimeout(updateScale, 100);

    window.addEventListener("resize", debouncedResize);
    window.addEventListener("orientationchange", orientationChange);

    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    motionQuery.addEventListener?.("change", updateScale);

    return () => {
      window.removeEventListener("resize", debouncedResize);
      window.removeEventListener("orientationchange", orientationChange);
      motionQuery.removeEventListener?.("change", updateScale);
    };
  }, [updateScale]);

  return scale;
}

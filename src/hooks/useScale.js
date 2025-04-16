"use client";

import { useEffect, useState, useCallback } from "react";
import debounce from "lodash.debounce";

/**
 * useScale – Iron-Class Responsive Hook (2025 Edition)
 * ====================================================
 * Maksimaliai tikslus ir išmanus „scale“ hookas:
 * - Tiksliai veikia desktop/mobile režimuose
 * - Reaguoja į virtualią rezoliuciją, orientaciją, HDPI, OS perjungimus
 * - Naudojamas per motion.div, transform, layout
 * - Suderinamas su SSR + 100% saugus
 */
export function useScale(initial = 0.92) {
  const [scale, setScale] = useState(initial);

  const updateScale = useCallback(() => {
    if (typeof window === "undefined") return;

    const width = window.innerWidth;
    const screenWidth = window.screen?.width || width;
    const outerWidth = window.outerWidth || width;
    const pixelRatio = window.devicePixelRatio || 1;

    const prefersReducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
    const isPortrait = window.matchMedia?.("(orientation: portrait)")?.matches;

    let newScale = initial;

    const effectiveWidth = Math.min(width, screenWidth, outerWidth);

    if (effectiveWidth < 468) {
      newScale = prefersReducedMotion ? 0.70 : 0.67;
    } else if (effectiveWidth < 768) {
      newScale = prefersReducedMotion ? 0.74 : 0.70;
    } else if (effectiveWidth < 1024) {
      newScale = prefersReducedMotion ? 0.95 : 0.97;
    } else {
      newScale = prefersReducedMotion ? 0.96 : 0.99;
    }

    // Retina / HiDPI papildoma korekcija
    if (pixelRatio >= 2 && effectiveWidth < 500) {
      newScale -= 0.015;
    }

    // Portreto režimo papildomas sumažinimas
    if (isPortrait && effectiveWidth < 768) {
      newScale -= 0.01;
    }

    // Užtikrinam limitus
    newScale = Math.max(0.55, Math.min(1.0, newScale));
    newScale = parseFloat(newScale.toFixed(4));

    setScale(newScale);
  }, [initial]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    updateScale(); // Init

    const debouncedResize = debounce(updateScale, 120);
    const orientationChange = () => setTimeout(updateScale, 80);
    const visualViewportChange = () => setTimeout(updateScale, 100);

    window.addEventListener("resize", debouncedResize);
    window.addEventListener("orientationchange", orientationChange);
    window.visualViewport?.addEventListener("resize", visualViewportChange);

    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    motionQuery.addEventListener?.("change", updateScale);

    return () => {
      window.removeEventListener("resize", debouncedResize);
      window.removeEventListener("orientationchange", orientationChange);
      window.visualViewport?.removeEventListener("resize", visualViewportChange);
      motionQuery.removeEventListener?.("change", updateScale);
    };
  }, [updateScale]);

  return scale;
}

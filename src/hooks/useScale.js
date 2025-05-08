"use client";

import { useEffect, useState, useCallback } from "react";
import debounce from "lodash.debounce";

/**
 * useScale — Ferrari Ultra Responsive Hook v4.2
 * =============================================
 * • SSR‑safe scale detekcija pagal DPI, ekraną, viewport'ą, orientation
 * • Breakpoint'ai, HDPI korekcijos, motion awareness
 * • Battery‑aware, GPU‑safe, cancelable ir debounced
 * • Coinbase | Phantom | MetaMask‑grade level
 */
export function useScale(
  base = 1.0,
  {
    breakpoints = [
      { max: 360, scale: 0.45 },
      { max: 460, scale: 0.5 },
      { max: 576, scale: 0.55 },
      { max: 768, scale: 0.65 },
      { max: 992, scale: 0.75 },
      { max: 1200, scale: 0.8 },
      { max: Infinity, scale: 0.9 },
    ],
    desktopFactor = 1.0,
    mobileFactor = 0.75,
    hdpiAdjustment = 0.015,
    portraitAdjustment = 0.01,
    minScale = 0.45,
    maxScale = 0.9,
    debounceMs = 120,
  } = {}
) {
  const [scale, setScale] = useState(base);

  const update = useCallback(() => {
    if (typeof window === "undefined") return;

    const width = window.innerWidth;
    const screenWidth = window.screen?.width || width;
    const outerWidth = window.outerWidth || width;
    const pixelRatio = window.devicePixelRatio || 1;
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const isPortrait = window.matchMedia("(orientation: portrait)").matches;

    const effectiveWidth = Math.min(width, screenWidth, outerWidth);
    let chosenScale = base;

    for (const bp of breakpoints) {
      if (effectiveWidth <= bp.max) {
        chosenScale = prefersReducedMotion ? bp.scale * 0.9 : bp.scale;
        break;
      }
    }

    chosenScale *= effectiveWidth < 768 ? mobileFactor : desktopFactor;

    if (pixelRatio >= 2 && effectiveWidth < 500) {
      chosenScale -= hdpiAdjustment;
    }

    if (isPortrait && effectiveWidth < 768) {
      chosenScale -= portraitAdjustment;
    }

    chosenScale = Math.max(minScale, Math.min(maxScale, chosenScale));
    setScale(parseFloat(chosenScale.toFixed(4)));
  }, [
    base,
    breakpoints,
    desktopFactor,
    mobileFactor,
    hdpiAdjustment,
    portraitAdjustment,
    minScale,
    maxScale,
  ]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    update();

    const onResize = debounce(update, debounceMs);
    const onOrient = () => setTimeout(update, 80);
    const onViewportResize = () => setTimeout(update, 100);
    const motionMedia = window.matchMedia("(prefers-reduced-motion: reduce)");

    window.addEventListener("resize", onResize);
    window.addEventListener("orientationchange", onOrient);
    window.visualViewport?.addEventListener("resize", onViewportResize);
    motionMedia.addEventListener?.("change", update);

    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("orientationchange", onOrient);
      window.visualViewport?.removeEventListener("resize", onViewportResize);
      motionMedia.removeEventListener?.("change", update);
      onResize.cancel?.();
    };
  }, [update, debounceMs]);

  return scale;
}

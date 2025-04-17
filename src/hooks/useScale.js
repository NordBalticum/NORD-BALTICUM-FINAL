"use client";

import { useEffect, useState, useCallback } from "react";
import debounce from "lodash.debounce";

/**
 * useScale – Ferrari Ultra Responsive Hook v2.0
 * =============================================
 * • Multi‑breakpoint scaling for any viewport, DPI & orientation
 * • Auto‑throttles on resize/orientation/viewport changes
 * • Honors prefers-reduced-motion
 * • SSR‑safe
 */
export function useScale(
  base = 0.92,
  {
    breakpoints = [
      { max: 360, scale: 0.65 },
      { max: 460, scale: 0.70 },
      { max: 576, scale: 0.75 },
      { max: 768, scale: 0.85 },
      { max: 992, scale: 0.95 },
      { max: Infinity, scale: 0.97 },
    ],
    desktopFactor = 0.99,
    mobileFactor = 0.67,
    hdpiAdjustment = 0.015,
    portraitAdjustment = 0.01,
    minScale = 0.55,
    maxScale = 1.0,
    debounceMs = 120,
  } = {}
) {
  const [scale, setScale] = useState(base);

  const update = useCallback(() => {
    if (typeof window === "undefined") return;

    const w = window.innerWidth;
    const sw = window.screen?.width || w;
    const ow = window.outerWidth || w;
    const pr = window.devicePixelRatio || 1;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const portrait = window.matchMedia("(orientation: portrait)").matches;

    // pick base by breakpoint
    let chosen = base;
    const effW = Math.min(w, sw, ow);
    for (const bp of breakpoints) {
      if (effW <= bp.max) {
        chosen = reduced ? bp.scale * 0.95 : bp.scale;
        break;
      }
    }

    // device‑type factor
    chosen *= effW < 768 ? mobileFactor : desktopFactor;

    // retina/HDPI tweak for small screens
    if (pr >= 2 && effW < 500) chosen -= hdpiAdjustment;

    // extra portrait tweak
    if (portrait && effW < 768) chosen -= portraitAdjustment;

    // clamp & round
    chosen = Math.max(minScale, Math.min(maxScale, chosen));
    setScale(parseFloat(chosen.toFixed(4)));
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
    // initial
    update();

    const onResize = debounce(update, debounceMs);
    const onOrient = () => setTimeout(update, 80);
    const onViewport = () => setTimeout(update, 100);
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");

    window.addEventListener("resize", onResize);
    window.addEventListener("orientationchange", onOrient);
    window.visualViewport?.addEventListener("resize", onViewport);
    media.addEventListener?.("change", update);

    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("orientationchange", onOrient);
      window.visualViewport?.removeEventListener("resize", onViewport);
      media.removeEventListener?.("change", update);
      onResize.cancel();
    };
  }, [update, debounceMs]);

  return scale;
}

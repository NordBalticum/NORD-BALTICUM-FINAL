"use client";

import { useEffect, useState, useCallback } from "react";
import debounce from "lodash.debounce";

/**
 * useScale – Ferrari Ultra Responsive Hook v3.0
 * =============================================
 * • Multi‑breakpoint scaling for any viewport, DPI & orientation
 * • Auto‑throttles on resize/orientation/viewport changes
 * • Honors prefers-reduced-motion
 * • SSR‑safe
 */
export function useScale(
  base = 1.0, // Default scale remains 1 for desktop.
  {
    breakpoints = [
      { max: 360, scale: 0.45 },
      { max: 460, scale: 0.50 },
      { max: 576, scale: 0.55 },
      { max: 768, scale: 0.65 },
      { max: 992, scale: 0.75 },
      { max: 1200, scale: 0.80 }, // For larger mobile devices
      { max: Infinity, scale: 0.9 }, // For large devices, no scaling
    ],
    desktopFactor = 1.0, // No scaling factor on desktop
    mobileFactor = 0.75, // Mobile devices will have this factor
    hdpiAdjustment = 0.015, // Small HDPI adjustment for small screens
    portraitAdjustment = 0.01, // Extra adjustment for portrait mode
    minScale = 0.45, // Minimum scale value for mobile devices
    maxScale = 0.9, // Maximum scale value
    debounceMs = 120, // Debouncing for resize events
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

    // Pick base scale by breakpoint
    let chosen = base;
    const effW = Math.min(w, sw, ow);

    // Adjusting scale based on device size and breakpoints
    for (const bp of breakpoints) {
      if (effW <= bp.max) {
        chosen = reduced ? bp.scale * 0.9 : bp.scale;
        break;
      }
    }

    // Device type factor
    chosen *= effW < 768 ? mobileFactor : desktopFactor;

    // Retina/HDPI adjustment for small screens
    if (pr >= 2 && effW < 500) chosen -= hdpiAdjustment;

    // Portrait mode adjustment
    if (portrait && effW < 768) chosen -= portraitAdjustment;

    // Clamp scale to ensure it's within minScale and maxScale
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
    // Initial scale update
    update();

    // Resize and orientation event listeners
    const onResize = debounce(update, debounceMs);
    const onOrient = () => setTimeout(update, 80);
    const onViewport = () => setTimeout(update, 100);
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");

    window.addEventListener("resize", onResize);
    window.addEventListener("orientationchange", onOrient);
    window.visualViewport?.addEventListener("resize", onViewport);
    media.addEventListener?.("change", update);

    // Cleanup event listeners
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

// src/utils/detectIsMobile.js
"use client";

export function detectIsMobile() {
  if (typeof window === "undefined") return false;

  const ua = navigator.userAgent.toLowerCase();

  const isTouch =
    navigator.maxTouchPoints > 1 ||
    "ontouchstart" in window ||
    window.matchMedia("(pointer: coarse)").matches;

  const isNarrowScreen = window.innerWidth < 900;

  const isMobileUA = /android|iphone|ipod|iemobile|blackberry|bada|webos|opera mini|mobile|palm|windows phone|nexus|pixel|sm-|samsung/.test(ua);
  const isTabletUA = /ipad|tablet/.test(ua);
  const isDesktopUA = /macintosh|windows nt|linux x86_64/.test(ua);

  // ✅ Galutinis sprendimas
  return (
    (isTouch && isNarrowScreen) ||
    (isTouch && (isMobileUA || (!isDesktopUA && !isTabletUA)))
  );
}

// src/utils/detectIsMobile.js
"use client";

let cachedResult = null;

export function detectIsMobile() {
  if (cachedResult !== null) return cachedResult;
  if (typeof window === "undefined") return false;

  const ua = navigator.userAgent.toLowerCase();

  const isTouchCapable =
    navigator.maxTouchPoints > 1 ||
    "ontouchstart" in window ||
    window.matchMedia("(pointer: coarse)").matches;

  const isNarrowWidth = window.innerWidth <= 900;
  const isLowRes = screen.width <= 900 || window.devicePixelRatio >= 2;

  const orientationPortrait =
    typeof window.orientation !== "undefined"
      ? window.orientation === 0
      : window.matchMedia("(orientation: portrait)").matches;

  const isMobileUA = /android|iphone|ipod|iemobile|blackberry|bada|webos|opera mini|mobile|palm|windows phone|nexus|pixel|sm-|samsung/.test(ua);
  const isTabletUA = /ipad|tablet/.test(ua);
  const isDesktopUA = /macintosh|windows nt|linux x86_64/.test(ua);

  const looksLikeMobile =
    (isTouchCapable && isNarrowWidth && orientationPortrait) ||
    (isTouchCapable && isMobileUA) ||
    (isTouchCapable && !isDesktopUA && !isTabletUA && isLowRes);

  cachedResult = looksLikeMobile;
  return cachedResult;
}

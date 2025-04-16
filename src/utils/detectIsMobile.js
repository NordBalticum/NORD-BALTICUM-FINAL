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

  const isMobileUA = /android|iphone|ipod|iemobile|blackberry|bada|webos|opera mini|mobile|palm|windows phone|nexus|pixel|sm-|samsung/.test(ua);
  const isTabletUA = /ipad|tablet|tab|kindle|silk|playbook/.test(ua);
  const isDesktopUA = /macintosh|windows nt|linux x86_64/.test(ua);

  const isNarrowWidth = window.innerWidth <= 920;
  const isShortHeight = window.innerHeight <= 600;
  const isPortrait = window.matchMedia("(orientation: portrait)").matches;

  const isLowRes = screen.width <= 920 || window.devicePixelRatio >= 2;

  const isMobileMediaQuery =
    window.matchMedia("(max-width: 920px)").matches &&
    window.matchMedia("(any-pointer: coarse)").matches;

  const isFoldable = window.matchMedia("(device-width: 540px) and (device-height: 720px), (max-width: 850px) and (max-height: 1600px)").matches;

  const isTabletMediaQuery = window.matchMedia("(min-device-width: 768px) and (max-device-width: 1366px)").matches;

  const looksLikeMobile =
    (isTouchCapable && isMobileUA) ||
    (isTouchCapable && isFoldable) ||
    (isTouchCapable && isTabletUA && isPortrait) ||
    (isTouchCapable && isTabletMediaQuery && isPortrait) ||
    (isTouchCapable && !isDesktopUA && !isTabletUA && (isNarrowWidth || isLowRes)) ||
    (isTouchCapable && isMobileMediaQuery) ||
    (isTouchCapable && isShortHeight);

  cachedResult = looksLikeMobile;
  return cachedResult;
}

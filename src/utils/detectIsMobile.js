// src/utils/detectIsMobile.js
"use client";

let cachedResult = null;

export function detectIsMobile() {
  if (cachedResult !== null) return cachedResult;
  if (typeof window === "undefined") return false;

  try {
    const ua = (navigator.userAgent || "").toLowerCase().replace(/\u0000/g, "");
    const uaData = navigator.userAgentData;
    const platform = navigator.platform?.toLowerCase?.() || "";

    const width = window.innerWidth || screen.width || 0;
    const height = window.innerHeight || screen.height || 0;

    const isSamsungUltra =
      /samsung/.test(ua) &&
      /sm-s9\d{2}|ultra|s24|s23|s22|s21/.test(ua) &&
      width >= 360 && width <= 920 &&
      height >= 640 && height <= 1800;

    const isTouchCapable =
      navigator.maxTouchPoints >= 1 ||
      "ontouchstart" in window ||
      window.matchMedia("(pointer: coarse)").matches;

    const isMobileUA = /android|iphone|ipod|iemobile|blackberry|bada|webos|opera mini|mobile|palm|windows phone|nexus|pixel|sm-|samsung/.test(ua);
    const isTabletUA = /ipad|tablet|tab|kindle|silk|playbook/.test(ua);
    const isDesktopUA =
      /macintosh|windows nt|linux x86_64/.test(ua) ||
      /mac|win|linux/.test(platform);

    const isNarrowWidth = width <= 920;
    const isShortHeight = height <= 600;
    const isPortrait = window.matchMedia("(orientation: portrait)").matches;
    const isLowRes = screen.width <= 920 || window.devicePixelRatio >= 2;

    const isMobileMediaQuery =
      window.matchMedia("(max-width: 920px)").matches &&
      window.matchMedia("(any-pointer: coarse)").matches;

    const isFoldable =
      window.matchMedia("(device-width: 540px) and (device-height: 720px)").matches ||
      window.matchMedia("(max-width: 850px) and (max-height: 1600px)").matches ||
      window.matchMedia("(min-width: 672px) and (max-width: 920px) and (max-height: 1800px)").matches;

    const isTabletMediaQuery = window.matchMedia(
      "(min-device-width: 600px) and (max-device-width: 1366px) and (orientation: portrait)"
    ).matches;

    const isUADataMobile = uaData?.mobile === true;

    const looksLikeMobile =
      isUADataMobile ||
      isSamsungUltra ||
      (isTouchCapable && isMobileUA) ||
      (isTouchCapable && isFoldable) ||
      (isTouchCapable && isTabletUA && isPortrait) ||
      (isTouchCapable && isTabletMediaQuery) ||
      (isTouchCapable && !isDesktopUA && !isTabletUA && (isNarrowWidth || isLowRes)) ||
      (isTouchCapable && isMobileMediaQuery) ||
      (isTouchCapable && isShortHeight);

    const isDefinitelyMobile = looksLikeMobile && width > 0 && height > 0;

    if (isDefinitelyMobile) {
      window.__DEBUG_MOBILE__ = true;
    }

    cachedResult = isDefinitelyMobile;
    return cachedResult;
  } catch (err) {
    console.warn("detectIsMobile() failed:", err);
    return false;
  }
}

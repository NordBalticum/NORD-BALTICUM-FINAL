// src/utils/detectIsMobile.js
"use client";

let cachedResult = null;

export function detectIsMobile() {
  if (cachedResult !== null) return cachedResult;

  if (typeof window === "undefined" || typeof navigator === "undefined") {
    return {
      isMobile: false,
      isTablet: false,
      isDesktop: true,
      scale: 1,
      connectionType: "unknown",
    };
  }

  try {
    const ua = navigator.userAgent?.toLowerCase?.() || "";
    const uaData = navigator.userAgentData;
    const platform = navigator.platform?.toLowerCase?.() || "";

    const width = window.innerWidth || screen.width || 0;
    const height = window.innerHeight || screen.height || 0;

    const isTouch =
      navigator.maxTouchPoints > 1 ||
      "ontouchstart" in window ||
      window.matchMedia("(pointer: coarse)").matches;

    const isMobileUA = /iphone|android|mobile|blackberry|phone|ipod/.test(ua);
    const isTabletUA = /ipad|tablet|kindle|nexus 7|tab/.test(ua);
    const isDesktopUA = /macintosh|windows nt|linux x86_64/.test(ua);

    const isNarrow = width > 0 && width <= 920;
    const isShort = height <= 600;
    const isPortrait = height > width;

    const uaDataMobile = uaData?.mobile === true;

    const isMobileGuess =
      uaDataMobile ||
      (isTouch && isMobileUA) ||
      (isTouch && isNarrow && !isDesktopUA) ||
      (isTouch && window.matchMedia("(max-width: 920px)").matches) ||
      (isTouch && isShort) ||
      false;

    const isTablet = isTabletUA || (isTouch && !isMobileGuess && isPortrait && width > 600 && width < 1024);
    const isMobile = isMobileGuess && !isTablet;
    const isDesktop = !isMobile && !isTablet;

    const scale = window.devicePixelRatio || 1;
    const connectionType = navigator.connection?.effectiveType || "unknown";

    cachedResult = {
      isMobile,
      isTablet,
      isDesktop,
      scale,
      connectionType,
    };

    return cachedResult;
  } catch (err) {
    console.warn("❌ detectIsMobile failed:", err);
    return {
      isMobile: false,
      isTablet: false,
      isDesktop: true,
      scale: 1,
      connectionType: "unknown",
    };
  }
}

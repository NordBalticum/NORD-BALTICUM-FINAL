// src/hooks/useDeviceInfo.js
"use client";

import { useState, useEffect, useMemo } from "react";
import debounce from "lodash.debounce";

export function useDeviceInfo() {
  const [info, setInfo] = useState({
    isMobile: false,
    isTablet: false,
    isDesktop: false,
    isFoldable: false,
    isLandscape: false,
    scale: 1,
    width: 0,
    height: 0,
    dpr: 1,
    connectionType: "unknown",
  });

  useEffect(() => {
    if (typeof window === "undefined") return;

    const detect = () => {
      try {
        const width = window.innerWidth || screen.width || 0;
        const height = window.innerHeight || screen.height || 0;
        const dpr = window.devicePixelRatio || 1;
        const ua = (navigator.userAgent || "").toLowerCase();
        const uaData = navigator.userAgentData;
        const platform = navigator.platform?.toLowerCase?.() || "";
        const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        const portrait = window.matchMedia("(orientation: portrait)").matches;
        const isTouch = "ontouchstart" in window || navigator.maxTouchPoints > 0;

        const isSamsungUltra = /samsung/.test(ua) &&
          /sm-s9\d{2}|ultra|s24|s23|s22|s21/.test(ua) &&
          width >= 360 && width <= 920 &&
          height >= 640 && height <= 1800;

        const isMobileUA = /android|iphone|ipod|iemobile|blackberry|bada|webos|opera mini|mobile|palm|windows phone|nexus|pixel|sm-|samsung/.test(ua);
        const isTabletUA = /ipad|tablet|tab|kindle|silk|playbook/.test(ua);
        const isDesktopUA = /macintosh|windows nt|linux x86_64/.test(ua) || /mac|win|linux/.test(platform);

        const isNarrow = width <= 920;

        const isFoldable = window.matchMedia("(min-device-width: 672px) and (max-device-width: 920px) and (max-device-height: 1800px)").matches;

        const connectionType = navigator.connection?.effectiveType || "unknown";

        let isMobile = false;
        let isTablet = false;

        if (uaData?.mobile) {
          isMobile = true;
        } else if (isSamsungUltra) {
          isMobile = true;
        } else if (isTouch && isMobileUA) {
          isMobile = true;
        } else if (isTouch && isTabletUA) {
          isTablet = true;
        } else if (isTouch && isFoldable) {
          isMobile = true;
        } else if (!isDesktopUA && isTouch && isNarrow) {
          isMobile = true;
        }

        const isLandscape = width > height;

        // Advanced Ferrari Scale
        let scale = 1.0;
        const effW = Math.min(width, screen.width || width);

        const breakpoints = [
          { max: 360, scale: 0.45 },
          { max: 460, scale: 0.50 },
          { max: 576, scale: 0.55 },
          { max: 768, scale: 0.65 },
          { max: 992, scale: 0.75 },
          { max: 1200, scale: 0.80 },
          { max: Infinity, scale: 0.90 },
        ];

        for (const bp of breakpoints) {
          if (effW <= bp.max) {
            scale = reduced ? bp.scale * 0.9 : bp.scale;
            break;
          }
        }

        scale *= effW < 768 ? 0.75 : 1.0; // mobile factor

        if (dpr >= 2 && effW < 500) scale -= 0.015; // HDPI adjustment
        if (portrait && effW < 768) scale -= 0.01; // Portrait adjustment

        scale = Math.max(0.45, Math.min(0.9, scale));
        scale = parseFloat(scale.toFixed(4));

        setInfo({
          isMobile,
          isTablet,
          isDesktop: !isMobile && !isTablet,
          isFoldable,
          isLandscape,
          scale,
          width,
          height,
          dpr,
          connectionType,
        });
      } catch (err) {
        console.error("[useDeviceInfo] Detection error:", err);
      }
    };

    const debouncedDetect = debounce(detect, 150);

    detect();
    window.addEventListener("resize", debouncedDetect);
    window.addEventListener("orientationchange", debouncedDetect);

    return () => {
      debouncedDetect.cancel();
      window.removeEventListener("resize", debouncedDetect);
      window.removeEventListener("orientationchange", debouncedDetect);
    };
  }, []);

  return info;
}

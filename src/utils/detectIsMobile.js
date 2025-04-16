// src/utils/detectIsMobile.js
"use client";

// ✅ Patikimas mobile detektorius be regexų
export const detectIsMobile = () => {
  if (typeof window === "undefined") return false;

  const isTouch =
    navigator.maxTouchPoints > 1 || "ontouchstart" in window;

  const isNarrow = window.innerWidth < 900;

  return isTouch && isNarrow;
};

// src/hooks/useAutoScale.js

import { useEffect } from "react";

export function useAutoScale(baseWidth = 1440, minScale = 0.66, maxScale = 1) {
  useEffect(() => {
    const updateScale = () => {
      const screenWidth = window.innerWidth;
      const scale = Math.min(Math.max(screenWidth / baseWidth, minScale), maxScale);
      document.documentElement.style.setProperty("--scale-factor", scale.toFixed(3));
    };
    updateScale();
    window.addEventListener("resize", updateScale);
    return () => window.removeEventListener("resize", updateScale);
  }, [baseWidth, minScale, maxScale]);
}

// src/hooks/useAutoScale.js
import { useEffect } from "react";

export function useAutoScale(baseWidth = 1440, baseHeight = 900, min = 0.44, max = 1) {
  useEffect(() => {
    const updateScale = () => {
      const scaleX = window.innerWidth / baseWidth;
      const scaleY = window.innerHeight / baseHeight;
      const scale = Math.min(scaleX, scaleY);
      const clamped = Math.max(min, Math.min(scale, max));
      document.documentElement.style.setProperty("--scale-factor", clamped.toFixed(3));
    };

    updateScale();
    window.addEventListener("resize", updateScale);
    return () => window.removeEventListener("resize", updateScale);
  }, [baseWidth, baseHeight, min, max]);
}

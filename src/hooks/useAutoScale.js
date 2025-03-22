import { useEffect } from "react";

/**
 * Automatinis `--scale-factor` nustatymas pagal ekrano dydį.
 * @param {number} baseWidth - dizaino bazinis plotis (default 1440px)
 * @param {number} min - minimalus scale
 * @param {number} max - maksimalus scale
 */
export function useAutoScale(baseWidth = 1440, min = 0.44, max = 1) {
  useEffect(() => {
    const setScale = () => {
      const scale = Math.min(max, Math.max(min, window.innerWidth / baseWidth));
      document.documentElement.style.setProperty('--scale-factor', scale.toFixed(3));
    };
    setScale();
    window.addEventListener("resize", setScale);
    return () => window.removeEventListener("resize", setScale);
  }, [baseWidth, min, max]);
}

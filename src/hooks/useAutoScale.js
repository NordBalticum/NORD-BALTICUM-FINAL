import { useEffect } from "react";

export function useAutoScale(baseWidth = 1440, min = 0.66, max = 1) {
  useEffect(() => {
    const updateScale = () => {
      const width = window.innerWidth;
      const scale = Math.min(Math.max(width / baseWidth, min), max);
      document.documentElement.style.setProperty("--scale-factor", scale.toFixed(3));
    };
    updateScale();
    window.addEventListener("resize", updateScale);
    return () => window.removeEventListener("resize", updateScale);
  }, [baseWidth, min, max]);
}

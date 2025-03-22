import { useEffect } from "react";

export function useAutoScale(baseWidth = 1440, minScale = 0.44, maxScale = 1) {
  useEffect(() => {
    const setScale = () => {
      const scale = Math.min(Math.max(window.innerWidth / baseWidth, minScale), maxScale);
      document.documentElement.style.setProperty("--scale-factor", scale.toFixed(3));
    };

    setScale(); // iškart paleisti
    window.addEventListener("resize", setScale);
    return () => window.removeEventListener("resize", setScale);
  }, [baseWidth, minScale, maxScale]);
}

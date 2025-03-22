// src/hooks/useAutoScale.js
import { useEffect } from "react";

export const useAutoScale = () => {
  useEffect(() => {
    const setScale = () => {
      const baseWidth = 1440;
      const currentWidth = window.innerWidth;
      let scale = currentWidth / baseWidth;

      // Clamp reikšmė tarp 0.7 ir 1.0
      scale = Math.max(0.7, Math.min(1, scale));

      document.documentElement.style.setProperty("--scale-factor", scale.toFixed(3));
    };

    setScale(); // inicijuoti iškart
    window.addEventListener("resize", setScale);
    return () => window.removeEventListener("resize", setScale);
  }, []);
};

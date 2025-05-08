"use client";

import { useEffect, useState } from "react";

/**
 * useGasSpeed – UI & tx gasSpeed control (slow | average | fast)
 * =========================================
 * - Stores speed in localStorage (survives reload)
 * - SSR-safe
 * - Validated input only
 */
export function useGasSpeed(defaultSpeed = "average") {
  const validSpeeds = ["slow", "average", "fast"];
  const key = "gasSpeed";

  const getInitialSpeed = () => {
    if (typeof window === "undefined") return defaultSpeed;

    try {
      const stored = localStorage.getItem(key);
      if (validSpeeds.includes(stored)) return stored;
    } catch {}
    return defaultSpeed;
  };

  const [speed, setSpeed] = useState(getInitialSpeed);

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(key, speed);
      } catch {}
    }
  }, [speed]);

  const setGasSpeed = (s) => {
    if (validSpeeds.includes(s)) setSpeed(s);
  };

  return { speed, setGasSpeed };
}

"use client";

/**
 * useGasSpeed — MetaMask-grade tx gas speed hook
 * ===============================================
 * • Saugo pasirinktą greitį: "slow", "average", "fast"
 * • Naudoja localStorage (išlieka po refresh)
 * • Pilnai SSR-safe
 * • Apsauga nuo klaidų / netinkamų reikšmių
 */

import { useEffect, useState } from "react";

export function useGasSpeed(defaultSpeed = "average") {
  const VALID_SPEEDS = ["slow", "average", "fast"];
  const STORAGE_KEY = "gasSpeed";

  const getInitialSpeed = () => {
    if (typeof window === "undefined") return defaultSpeed;
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return VALID_SPEEDS.includes(stored) ? stored : defaultSpeed;
    } catch {
      return defaultSpeed;
    }
  };

  const [speed, setSpeed] = useState(getInitialSpeed);

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(STORAGE_KEY, speed);
      } catch {
        // Silent fail — e.g. Safari Private Mode
      }
    }
  }, [speed]);

  const setGasSpeed = (newSpeed) => {
    if (VALID_SPEEDS.includes(newSpeed)) {
      setSpeed(newSpeed);
    }
  };

  return {
    speed,        // "slow" | "average" | "fast"
    setGasSpeed,  // fn(newSpeed)
  };
}

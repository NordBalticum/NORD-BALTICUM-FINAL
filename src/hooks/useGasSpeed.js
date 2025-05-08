// src/hooks/useGasSpeed.js
"use client";

import { useState } from "react";

export function useGasSpeed(defaultSpeed = "average") {
  const [speed, setSpeed] = useState(defaultSpeed);

  const isValid = (s) => ["slow", "average", "fast"].includes(s);
  const setGasSpeed = (s) => {
    if (isValid(s)) setSpeed(s);
  };

  return { speed, setGasSpeed };
}

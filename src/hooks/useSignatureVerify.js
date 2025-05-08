"use client";

import { useState } from "react";
import { ethers } from "ethers";

export function useSignatureVerify() {
  const [verifying, setVerifying] = useState(false);
  const [isValid, setIsValid] = useState(null);
  const [error, setError] = useState(null);

  const verify = async (message, signature, expectedAddress) => {
    setVerifying(true);
    setError(null);
    setIsValid(null);

    try {
      const recoveredAddress = ethers.verifyMessage(message, signature);
      const valid = recoveredAddress.toLowerCase() === expectedAddress.toLowerCase();
      setIsValid(valid);
    } catch (err) {
      console.warn("❌ useSignatureVerify error:", err.message);
      setError(err.message);
    } finally {
      setVerifying(false);
    }
  };

  return { verify, verifying, isValid, error };
}

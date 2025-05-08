"use client";

/**
 * useSignatureVerify — MetaMask-grade Signature Verifier
 * =======================================================
 * Tikrina ar `signature` atitinka `message` ir priklauso `expectedAddress`.
 * Pilnai integruotas su ethers.js ir veikia visuose EVM tinkluose.
 */

import { useState } from "react";
import { ethers } from "ethers";

export function useSignatureVerify() {
  const [verifying, setVerifying] = useState(false);
  const [isValid, setIsValid] = useState(null);
  const [recoveredAddress, setRecoveredAddress] = useState(null);
  const [error, setError] = useState(null);

  const verify = async (message, signature, expectedAddress) => {
    setVerifying(true);
    setError(null);
    setIsValid(null);
    setRecoveredAddress(null);

    try {
      if (!message || !signature || !expectedAddress) {
        throw new Error("Missing required fields");
      }

      const recovered = ethers.verifyMessage(message, signature);
      const valid =
        recovered.toLowerCase() === expectedAddress.toLowerCase();

      setRecoveredAddress(recovered);
      setIsValid(valid);
    } catch (err) {
      console.warn("❌ useSignatureVerify:", err.message);
      setError(err.message || "Verification failed");
    } finally {
      setVerifying(false);
    }
  };

  return {
    verify,
    verifying,
    isValid,             // true | false | null
    recoveredAddress,    // address from signature
    error,
  };
}

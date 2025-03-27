"use client";

import React, { useState } from "react";
import { useWebAuthn } from "@/contexts/WebAuthnContext";
import { useMagicLink } from "@/contexts/MagicLinkContext";
import styles from "@/styles/components/BiometricButton.module.css";
import Image from "next/image";

export default function BiometricButton() {
  const { biometricEmail, signInWithEmail } = useMagicLink();
  const { loginWebAuthn } = useWebAuthn();

  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState("");

  const handleBiometricLogin = async () => {
    if (!biometricEmail) {
      setStatus("error");
      setMessage("❌ Biometric email not found.");
      return;
    }

    setStatus("sending");
    setMessage("⏳ Authenticating...");

    try {
      const success = await loginWebAuthn(biometricEmail);
      if (success) {
        setStatus("success");
        setMessage("✅ Logged in via biometrics.");
      } else {
        setStatus("fallback");
        setMessage("⚠️ Biometric failed. Trying Magic Link...");
        await signInWithEmail(biometricEmail);
        setStatus("success");
        setMessage("✅ Magic Link sent to your email.");
      }
    } catch (err) {
      console.error("Biometric error:", err);
      setStatus("error");
      setMessage("❌ Biometric login failed.");
    }
  };

  return (
    <div className={styles.wrapper}>
      <button
        onClick={handleBiometricLogin}
        className={styles.bioButton}
        disabled={status === "sending"}
      >
        <Image
          src="/icons/fingerprint.svg"
          alt="Biometric Icon"
          width={24}
          height={24}
          className={styles.icon}
        />
        {status === "sending" ? "Authenticating..." : "Login with Biometrics"}
      </button>

      {message && <p className={styles.message}>{message}</p>}
    </div>
  );
}

"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useMagicLink } from "@/contexts/MagicLinkContext";
import { useWebAuthn } from "@/contexts/WebAuthnContext";
import Image from "next/image";
import styles from "@/styles/index.module.css";

const HomePage = () => {
  const router = useRouter();

  const {
    user,
    signInWithEmail,
    loginWithGoogle,
    biometricEmail,
  } = useMagicLink();

  const { loginWebAuthn } = useWebAuthn();

  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState("idle"); // idle | sending | success | error
  const [autoTried, setAutoTried] = useState(false);

  // Redirect to dashboard if user is already logged in
  useEffect(() => {
    if (user) router.push("/dashboard");
  }, [user]);

  // Automatic biometric login if the user exists and there's a saved biometric email
  useEffect(() => {
    const autoLogin = async () => {
      if (!user && biometricEmail && !autoTried) {
        setAutoTried(true);
        setStatus("sending");
        setMessage("⏳ Logging in via biometrics...");
        const success = await loginWebAuthn(biometricEmail);
        if (success) {
          setStatus("success");
          setMessage("✅ Logged in with biometrics.");
        } else {
          setStatus("error");
          setMessage("❌ Biometric login failed.");
        }
      }
    };
    autoLogin();
  }, [user, biometricEmail, autoTried]);

  // Email login handler
  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setMessage("");
    setStatus("sending");

    try {
      await signInWithEmail(email.trim());
      setStatus("success");
      setMessage("✅ Magic Link sent! Check your email.");
      setEmail("");
    } catch (error) {
      console.error("❌ Magic Link Error:", error);
      setStatus("error");
      setMessage("❌ Failed to send link. Try again.");
    }
  };

  // Biometric login handler
  const handleBiometricLogin = async () => {
    if (!biometricEmail) {
      setMessage("❌ No biometric email found.");
      return;
    }

    setStatus("sending");
    setMessage("⏳ Logging in with biometrics...");

    try {
      await loginWithEmail(biometricEmail);
      setStatus("success");
      setMessage("✅ Magic Link sent via biometrics.");
    } catch (error) {
      console.error("❌ Biometric login failed:", error);
      setStatus("error");
      setMessage("❌ Failed biometric login.");
    }
  };

  // Google login handler (if Google login is supported)
  const handleGoogleLogin = async () => {
    try {
      await loginWithGoogle();
      setStatus("success");
      setMessage("✅ Google login successful!");
    } catch (error) {
      console.error("❌ Google Login Error:", error);
      setStatus("error");
      setMessage("❌ Failed Google login.");
    }
  };

  return (
    <main className="fullscreenContainer" role="main" style={{ minHeight: "100dvh" }}>
      <div className={styles.centerWrapper}>
        {/* Logo */}
        <div className={styles.logoContainer}>
          <Image
            src="/icons/logo.svg"
            alt="NordBalticum Logo"
            width={268}
            height={268}
            className={styles.logoImage}
            priority
          />
        </div>

        {/* Login Box */}
        <section className={`${styles.loginBox} glassBox fadeIn`}>
          <h1 className={styles.title}>Welcome to NordBalticum</h1>
          <p className={styles.subtitle}>Sign in with your email, biometrics, or Google</p>

          {/* Email Form */}
          <form onSubmit={handleEmailLogin} className={styles.form}>
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              maxLength={80}
              autoComplete="email"
              className={styles.input}
            />
            <button
              type="submit"
              className={styles.button}
              disabled={status === "sending"}
            >
              {status === "sending" ? "Sending..." : "Send Magic Link"}
            </button>
          </form>

          {/* Google Login */}
          <button onClick={handleGoogleLogin} className={styles.button}>
            Login with Google
          </button>

          {/* Biometric Login Option */}
          {biometricEmail && (
            <>
              <div className={styles.divider}>or</div>
              <button className={styles.biometricButton} onClick={handleBiometricLogin}>
                Login with Biometrics
              </button>
            </>
          )}

          {/* Status Message */}
          {message && (
            <p className={status === "error" ? styles.error : styles.success}>
              {message}
            </p>
          )}
        </section>
      </div>
    </main>
  );
};

export default HomePage;

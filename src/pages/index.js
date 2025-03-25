"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { useMagicLink } from "@/contexts/MagicLinkContext";
import { useWebAuthn } from "@/contexts/WebAuthnContext";
import Head from "next/head";
import Image from "next/image";
import styles from "@/styles/index.module.css";

const LoginPage = () => {
  const router = useRouter();
  const { user, loginWithEmail, biometricEmail } = useMagicLink();
  const { loginWebAuthn } = useWebAuthn();

  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("idle"); // idle | sending | sent | error
  const [message, setMessage] = useState("");
  const [autoBioTried, setAutoBioTried] = useState(false);

  // Redirect to dashboard if user is already logged in
  useEffect(() => {
    if (user) {
      router.push("/dashboard");
    }
  }, [user]);

  // Automatic biometric login if the user exists and there's a saved biometric email
  useEffect(() => {
    const autoLogin = async () => {
      if (!user && biometricEmail && !autoBioTried) {
        setAutoBioTried(true);
        const success = await loginWebAuthn(biometricEmail);
        if (!success) console.warn("Biometric login failed");
      }
    };
    autoLogin();
  }, [user, biometricEmail, autoBioTried]);

  // Email login handler
  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setMessage("");
    setStatus("sending");

    try {
      await loginWithEmail(email.trim());
      setStatus("sent");
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
      setStatus("sent");
      setMessage("✅ Magic Link sent via biometrics.");
    } catch (error) {
      console.error("❌ Biometric login failed:", error);
      setStatus("error");
      setMessage("❌ Failed biometric login.");
    }
  };

  // Google login handler (not included in previous code, added for completeness)
  const handleGoogleLogin = async () => {
    // Logic for Google login
  };

  return (
    <>
      <Head>
        <title>NordBalticum – Login</title>
        <meta name="description" content="Secure login with Magic Link – NordBalticum Web3 Banking" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <link rel="icon" href="/icons/logo.png" />
      </Head>

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
            <p className={styles.subtitle}>Sign in with your email or biometrics</p>

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
    </>
  );
};

export default LoginPage;

"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useMagicLink } from "@/contexts/MagicLinkContext";
import { useWebAuthn } from "@/contexts/WebAuthnContext";
import Image from "next/image";
import styles from "@/styles/index.module.css";

const Home = () => {
  const router = useRouter();
  const {
    user,
    signInWithEmail,
    loginWithGoogle,
    biometricEmail
  } = useMagicLink();

  const { loginWebAuthn } = useWebAuthn();

  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("idle"); // idle | sending | success | error
  const [message, setMessage] = useState("");
  const [autoTried, setAutoTried] = useState(false);

  // ✅ Redirect į dashboard jei prisijungęs
  useEffect(() => {
    if (user) router.push("/dashboard");
  }, [user]);

  // ✅ Automatinis biometrinis login
  useEffect(() => {
    const tryBiometric = async () => {
      if (!user && biometricEmail && !autoTried) {
        setAutoTried(true);
        setStatus("sending");
        setMessage("⏳ Logging in with biometrics...");

        try {
          const success = await loginWebAuthn(biometricEmail);
          if (success) {
            setStatus("success");
            setMessage("✅ Biometric login success.");
          } else {
            setStatus("error");
            setMessage("❌ Biometric login failed.");
          }
        } catch (err) {
          console.error("Biometric login error:", err);
          setStatus("error");
          setMessage("❌ Biometric login error.");
        }
      }
    };
    tryBiometric();
  }, [user, biometricEmail, autoTried]);

  // ✅ Email login
  const handleEmailLogin = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      setMessage("❌ Please enter a valid email.");
      return;
    }

    setStatus("sending");
    setMessage("⏳ Sending Magic Link...");

    try {
      await signInWithEmail(email.trim());
      localStorage.setItem("biometric_user", email.trim());
      setStatus("success");
      setMessage("✅ Magic Link sent. Check your inbox.");
      setEmail("");
    } catch (err) {
      console.error("Magic Link error:", err);
      setStatus("error");
      setMessage("❌ Failed to send Magic Link.");
    }
  };

  // ✅ Google login
  const handleGoogleLogin = async () => {
    setStatus("sending");
    setMessage("⏳ Logging in with Google...");

    try {
      await loginWithGoogle();
      setStatus("success");
      setMessage("✅ Logged in with Google.");
    } catch (err) {
      console.error("Google login error:", err);
      setStatus("error");
      setMessage("❌ Google login failed.");
    }
  };

  // ✅ Manual biometric login
  const handleBiometricLogin = async () => {
    if (!biometricEmail) {
      setMessage("❌ No biometric session found.");
      return;
    }

    setStatus("sending");
    setMessage("⏳ Biometric login...");

    try {
      const success = await loginWebAuthn(biometricEmail);
      if (success) {
        setStatus("success");
        setMessage("✅ Biometric login success.");
      } else {
        setStatus("error");
        setMessage("❌ Biometric login failed.");
      }
    } catch (err) {
      console.error("Biometric login error:", err);
      setStatus("error");
      setMessage("❌ Biometric login error.");
    }
  };

  return (
    <main className={styles.container}>
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
        <section className={styles.loginBox}>
          <h1 className={styles.title}>Welcome to NordBalticum</h1>
          <p className={styles.subtitle}>Secure Web3 access with Email, Google, Biometrics</p>

          {/* Email Login */}
          <form onSubmit={handleEmailLogin} className={styles.form}>
            <input
              type="email"
              className={styles.input}
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={status === "sending"}
              autoComplete="email"
            />
            <button type="submit" className={styles.button} disabled={status === "sending"}>
              {status === "sending" ? "Sending..." : "Send Magic Link"}
            </button>
          </form>

          {/* Google Login */}
          <button
            onClick={handleGoogleLogin}
            className={styles.googleButton}
            disabled={status === "sending"}
          >
            <Image
              src="/icons/google-logo.png"
              alt="Google"
              width={20}
              height={20}
              className={styles.googleLogo}
            />
            Login with Google
          </button>

          {/* Biometric Login */}
          {biometricEmail && (
            <>
              <div className={styles.divider}>or</div>
              <button
                onClick={handleBiometricLogin}
                className={styles.biometricButton}
                disabled={status === "sending"}
              >
                Login with Biometrics
              </button>
            </>
          )}

          {/* Status Message */}
          {message && (
            <p className={styles.message}>{message}</p>
          )}
        </section>
      </div>
    </main>
  );
};

export default Home;

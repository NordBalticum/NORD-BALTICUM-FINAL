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
    biometricEmail
  } = useMagicLink();

  const { loginWebAuthn } = useWebAuthn();

  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("idle"); // idle | sending | success | error
  const [message, setMessage] = useState("");
  const [autoTried, setAutoTried] = useState(false);

  // ✅ Redirect jei user prisijungęs
  useEffect(() => {
    if (user) router.push("/dashboard");
  }, [user]);

  // ✅ Automatinis biometrinis login
  useEffect(() => {
    const tryAutoBiometric = async () => {
      if (!user && biometricEmail && !autoTried) {
        setAutoTried(true);
        setStatus("sending");
        setMessage("⏳ Trying biometric login...");

        try {
          const success = await loginWebAuthn(biometricEmail);
          if (success) {
            setStatus("success");
            setMessage("✅ Biometric login success!");
          } else {
            setStatus("error");
            setMessage("❌ Biometric login failed.");
          }
        } catch (err) {
          console.error("Biometric Error:", err);
          setStatus("error");
          setMessage("❌ Biometric login error.");
        }
      }
    };
    tryAutoBiometric();
  }, [user, biometricEmail, autoTried]);

  // ✅ Email login handler
  const handleEmailLogin = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      setMessage("❌ Please enter your email.");
      return;
    }

    setStatus("sending");
    setMessage("⏳ Sending Magic Link...");

    try {
      await signInWithEmail(email.trim());
      localStorage.setItem("biometric_user", email.trim());
      setStatus("success");
      setMessage("✅ Magic Link sent. Check your email!");
      setEmail("");
    } catch (err) {
      console.error("Email Login Error:", err);
      setStatus("error");
      setMessage("❌ Failed to send Magic Link.");
    }
  };

  // ✅ Google login handler
  const handleGoogleLogin = async () => {
    setStatus("sending");
    setMessage("⏳ Logging in with Google...");

    try {
      await loginWithGoogle();
      setStatus("success");
      setMessage("✅ Logged in with Google.");
    } catch (err) {
      console.error("Google Login Error:", err);
      setStatus("error");
      setMessage("❌ Google login failed.");
    }
  };

  // ✅ Biometric login handler (manual)
  const handleBiometricLogin = async () => {
    if (!biometricEmail) {
      setMessage("❌ No biometric email saved.");
      return;
    }

    setStatus("sending");
    setMessage("⏳ Logging in with biometrics...");

    try {
      const success = await loginWebAuthn(biometricEmail);
      if (success) {
        setStatus("success");
        setMessage("✅ Biometric login success!");
      } else {
        setStatus("error");
        setMessage("❌ Biometric login failed.");
      }
    } catch (err) {
      console.error("Biometric Error:", err);
      setStatus("error");
      setMessage("❌ Biometric login error.");
    }
  };

  return (
    <main className={styles.container}>
      <div className={styles.centerWrapper}>
        {/* LOGO */}
        <div className={styles.logoContainer}>
          <Image
            src="/icons/logo.svg"
            alt="NordBalticum Logo"
            width={240}
            height={240}
            className={styles.logoImage}
            priority
          />
        </div>

        {/* LOGIN BOX */}
        <section className={styles.loginBox}>
          <h1 className={styles.title}>Welcome to NordBalticum</h1>
          <p className={styles.subtitle}>
            Secure Web3 Login with Email, Google or Biometrics
          </p>

          {/* Email login */}
          <form className={styles.form} onSubmit={handleEmailLogin}>
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className={styles.input}
              autoComplete="email"
              disabled={status === "sending"}
            />
            <button
              type="submit"
              className={styles.button}
              disabled={status === "sending"}
            >
              {status === "sending" ? "Sending..." : "Send Magic Link"}
            </button>
          </form>

          {/* Google login */}
          <button
            onClick={handleGoogleLogin}
            className={styles.googleButton}
            disabled={status === "sending"}
          >
            <Image
              src="/icons/google-logo.png"
              alt="Google"
              width={22}
              height={22}
              className={styles.googleLogo}
            />
            Login with Google
          </button>

          {/* Biometric login */}
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

          {/* Status message */}
          {message && (
            <p className={styles.message}>
              {message}
            </p>
          )}
        </section>
      </div>
    </main>
  );
};

export default HomePage;

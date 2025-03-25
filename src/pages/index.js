"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useMagicLink } from "@/contexts/MagicLinkContext";
import { useWebAuthn } from "@/contexts/WebAuthnContext";
import Image from "next/image";
import styles from "@/styles/index.module.css";
import StarsBackground from "@/components/StarsBackground";

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
  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState("");
  const [autoTried, setAutoTried] = useState(false);

  const logoRef = useRef(null);

  // ✅ 3D tilt pelės efektas
  useEffect(() => {
    const handleTilt = (e) => {
      const logo = logoRef.current;
      if (!logo) return;

      const rect = logo.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      const rotateX = ((y - centerY) / centerY) * -5;
      const rotateY = ((x - centerX) / centerX) * 5;

      logo.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.07)`;
    };

    const resetTilt = () => {
      if (logoRef.current) {
        logoRef.current.style.transform = "rotateX(0deg) rotateY(0deg) scale(1)";
      }
    };

    const logoContainer = document.querySelector(`.${styles.logoContainer}`);
    if (logoContainer) {
      logoContainer.addEventListener("mousemove", handleTilt);
      logoContainer.addEventListener("mouseleave", resetTilt);
    }

    return () => {
      if (logoContainer) {
        logoContainer.removeEventListener("mousemove", handleTilt);
        logoContainer.removeEventListener("mouseleave", resetTilt);
      }
    };
  }, []);

  useEffect(() => {
    if (user) router.push("/dashboard");
  }, [user]);

  useEffect(() => {
    const autoLogin = async () => {
      if (!user && biometricEmail && !autoTried) {
        setAutoTried(true);
        setStatus("sending");
        setMessage("⏳ Logging in with biometrics...");
        try {
          const success = await loginWebAuthn(biometricEmail);
          setStatus(success ? "success" : "error");
          setMessage(success ? "✅ Biometric login success." : "❌ Biometric login failed.");
        } catch (err) {
          console.error("Biometric login error:", err);
          setStatus("error");
          setMessage("❌ Biometric login error.");
        }
      }
    };
    autoLogin();
  }, [user, biometricEmail, autoTried]);

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

  const handleBiometricLogin = async () => {
    if (!biometricEmail) {
      setMessage("❌ No biometric session found.");
      return;
    }
    setStatus("sending");
    setMessage("⏳ Biometric login...");
    try {
      const success = await loginWebAuthn(biometricEmail);
      setStatus(success ? "success" : "error");
      setMessage(success ? "✅ Biometric login success." : "❌ Biometric login failed.");
    } catch (err) {
      console.error("Biometric login error:", err);
      setStatus("error");
      setMessage("❌ Biometric login error.");
    }
  };

  return (
    <>
      <StarsBackground />
      <main className={styles.container}>
        <div className={styles.centerWrapper}>
          <div className={styles.logoContainer}>
            <Image
              src="/icons/logo.svg"
              alt="NordBalticum Logo"
              width={268}
              height={268}
              className={styles.logoImage}
              ref={logoRef}
              priority
            />
          </div>

          <section className={styles.loginBox}>
            <h1 className={styles.title}>Welcome to NordBalticum</h1>
            <p className={styles.subtitle}>Secure Web3 access with Email, Google, Biometrics</p>

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

            <button onClick={handleGoogleLogin} className={styles.googleButton} disabled={status === "sending"}>
              <Image
                src="/icons/google-logo.png"
                alt="Google Logo"
                width={20}
                height={20}
                className={styles.googleLogo}
              />
              Login with Google
            </button>

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

            {message && <p className={styles.message}>{message}</p>}
          </section>
        </div>
      </main>
    </>
  );
};

export default Home;

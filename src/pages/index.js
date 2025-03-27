"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import styles from "@/styles/index.module.css";
import StarsBackground from "@/components/StarsBackground";

// Kontekstai
import { useAuth } from "@/contexts/AuthContext";
import { useMagicLink } from "@/contexts/MagicLinkContext";

export default function Home() {
  const router = useRouter();
  const { user: authUser, signInWithEmail, loginWithGoogle, sessionReady } = useAuth();
  const { user: magicUser } = useMagicLink();

  const user = authUser || magicUser;
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState("");
  const logoRef = useRef(null);

  // === 3D Tilt Logo Animation
  useEffect(() => {
    const logo = logoRef.current;
    if (!logo) return;

    const handleMouseMove = (e) => {
      const rect = logo.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const rotateX = ((y - centerY) / centerY) * -4;
      const rotateY = ((x - centerX) / centerX) * 4;
      logo.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.05)`;
    };

    const resetTilt = () => {
      logo.style.transform = "rotateX(0deg) rotateY(0deg) scale(1)";
    };

    const parent = logo?.parentNode;
    parent?.addEventListener("mousemove", handleMouseMove);
    parent?.addEventListener("mouseleave", resetTilt);

    return () => {
      parent?.removeEventListener("mousemove", handleMouseMove);
      parent?.removeEventListener("mouseleave", resetTilt);
    };
  }, []);

  // === Redirect if logged in
  useEffect(() => {
    if (sessionReady && user) {
      router.push("/dashboard");
    }
  }, [sessionReady, user]);

  // === Email login
  const handleEmailLogin = async (e) => {
    e.preventDefault();
    if (!email.trim()) return setMessage("❌ Please enter a valid email.");
    setStatus("sending");
    setMessage("⏳ Sending Magic Link...");
    try {
      await signInWithEmail(email.trim());
      setMessage("✅ Check your inbox for the Magic Link.");
      setEmail("");
    } catch (err) {
      console.error("Email login error:", err);
      setMessage("❌ Failed to send Magic Link.");
    } finally {
      setStatus("idle");
    }
  };

  // === Google login
  const handleGoogleLogin = async () => {
    setStatus("sending");
    setMessage("⏳ Logging in with Google...");
    try {
      await loginWithGoogle();
      setMessage("✅ Logged in with Google.");
    } catch (err) {
      console.error("Google login error:", err);
      setMessage("❌ Google login failed.");
    } finally {
      setStatus("idle");
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
              width={260}
              height={260}
              ref={logoRef}
              className={styles.logoImage}
              priority
            />
          </div>

          <section className={styles.loginBox}>
            <h1 className={styles.title}>Welcome to NordBalticum</h1>
            <p className={styles.subtitle}>Login with Email or Google</p>

            <form onSubmit={handleEmailLogin} className={styles.form}>
              <input
                type="email"
                className={styles.input}
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={status === "sending"}
                autoComplete="email"
              />
              <button type="submit" className={styles.button} disabled={status === "sending"}>
                {status === "sending" ? "Sending..." : "Send Magic Link"}
              </button>
            </form>

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

            {message && <p className={styles.message}>{message}</p>}
          </section>
        </div>
      </main>
    </>
  );
            }

"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import styles from "@/styles/index.module.css";
import StarsBackground from "@/components/StarsBackground";
import { useMagicLink } from "@/contexts/MagicLinkContext";

export default function Home() {
  const router = useRouter();
  const { user, loadingUser, signInWithEmail, signInWithGoogle } = useMagicLink();

  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState("");
  const logoRef = useRef(null);

  // Tilt effect
  useEffect(() => {
    const logo = logoRef.current;
    if (!logo) return;

    const handleMouseMove = (e) => {
      const rect = logo.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const rotateX = ((y - rect.height / 2) / rect.height / 2) * -4;
      const rotateY = ((x - rect.width / 2) / rect.width / 2) * 4;
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

  // Redirect if already logged in
  useEffect(() => {
    if (!loadingUser && user) {
      router.push("/dashboard");
    }
  }, [user, loadingUser, router]);

  // Magic link email login
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
      console.error("Magic Link error:", err?.message || err);
      setMessage("❌ Failed to send Magic Link.");
    } finally {
      setStatus("idle");
    }
  };

  // Google OAuth login
  const handleGoogleLogin = async () => {
    setStatus("sending");
    setMessage("⏳ Logging in with Google...");
    try {
      await signInWithGoogle();
    } catch (err) {
      console.error("Google login error:", err?.message || err);
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
                autoFocus
                required
              />
              <button
                type="submit"
                className={styles.button}
                disabled={status === "sending"}
                aria-busy={status === "sending"}
              >
                {status === "sending" ? "Sending..." : "Send Magic Link"}
              </button>
            </form>

            <button
              onClick={handleGoogleLogin}
              className={styles.googleButton}
              disabled={status === "sending"}
              aria-busy={status === "sending"}
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

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { useMagicLink } from "@/contexts/MagicLinkContext";
import Head from "next/head";
import Image from "next/image";
import styles from "@/styles/index.module.css";

export default function Home() {
  const router = useRouter();
  const { user, signInWithEmail } = useMagicLink();

  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  // ✅ Auto redirect if logged in
  useEffect(() => {
    if (user) router.push("/dashboard");
  }, [user, router]);

  // ✅ Magic link email login
  const handleLogin = async (e) => {
    e.preventDefault();
    setMessage("");
    try {
      await signInWithEmail(email.trim());
      setMessage("Check your email for the magic link!");
      setEmail("");
    } catch (error) {
      console.error("Magic Link Login Error:", error);
      setMessage("Login failed. Please try again.");
    }
  };

  return (
    <>
      <Head>
        <title>NordBalticum – Login</title>
        <meta name="description" content="Secure login with Magic Link – NordBalticum Web3 Banking" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
      </Head>

      <main
        className="fullscreenContainer"
        role="main"
        aria-label="Login area"
        style={{ minHeight: "100dvh" }}
      >
        <div className={styles.centerWrapper}>
          {/* ✅ Centered animated logo with glow */}
          <div className={styles.logoContainer}>
            <Image
              src="/icons/logo.png"
              alt="NordBalticum Logo"
              width={108}
              height={108}
              className={styles.logoImage}
              priority
            />
          </div>

          {/* ✅ Login Box */}
          <section className={`${styles.loginBox} glassBox fadeIn`} aria-label="Login box">
            <h1 className={styles.title}>Welcome to NordBalticum</h1>
            <p className={styles.subtitle}>Sign in with your email to get started</p>

            <form onSubmit={handleLogin} className={styles.form} aria-label="Login form">
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                maxLength={80}
                autoComplete="email"
                className={styles.input}
                aria-label="Email input"
              />
              <button
                type="submit"
                className={styles.button}
                aria-label="Send magic link"
              >
                Send Magic Link
              </button>
            </form>

            {message && (
              <p className={styles.message} role="alert">
                {message}
              </p>
            )}
          </section>
        </div>
      </main>
    </>
  );
}

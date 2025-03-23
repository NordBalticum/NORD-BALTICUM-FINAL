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
  const [status, setStatus] = useState("idle"); // idle | sending | sent | error

  // ✅ Automatinis redirect jei user prisijungęs
  useEffect(() => {
    if (user) router.push("/dashboard");
  }, [user, router]);

  // ✅ Magic Link Handler
  const handleLogin = async (e) => {
    e.preventDefault();
    setMessage("");
    setStatus("sending");

    try {
      await signInWithEmail(email.trim());
      setStatus("sent");
      setMessage("✅ Magic Link sent! Check your email.");
      setEmail("");
    } catch (error) {
      console.error("❌ Magic Link Error:", error);
      setStatus("error");
      setMessage("❌ Failed to send link. Try again.");
    }
  };

  return (
    <>
      <Head>
        <title>NordBalticum – Login</title>
        <meta name="description" content="Secure login with Magic Link – NordBalticum Web3 Banking" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <link rel="icon" href="/icons/logo.png" />
      </Head>

      <main
        className="fullscreenContainer"
        role="main"
        aria-label="Login Page"
        style={{ minHeight: "100dvh" }}
      >
        <div className={styles.centerWrapper}>
          {/* ✅ Logo */}
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

          {/* ✅ Login Box */}
          <section
            className={`${styles.loginBox} glassBox fadeIn`}
            aria-label="Login box"
          >
            <h1 className={styles.title}>Welcome to NordBalticum</h1>
            <p className={styles.subtitle}>Sign in with your email</p>

            <form
              onSubmit={handleLogin}
              className={styles.form}
              aria-label="Login form"
            >
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
                disabled={status === "sending"}
              >
                {status === "sending" ? "Sending..." : "Send Magic Link"}
              </button>
            </form>

            {message && (
              <p
                className={styles.message}
                role="alert"
                style={{ color: status === "error" ? "#ff4c4c" : "#00ffc8" }}
              >
                {message}
              </p>
            )}
          </section>
        </div>
      </main>
    </>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { useMagicLink } from "@/contexts/MagicLinkContext";
import styles from "@/styles/index.module.css";
import Head from "next/head";

export default function Home() {
  const { user, signInWithEmail } = useMagicLink();
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const router = useRouter();

  useEffect(() => {
    if (user) {
      router.push("/dashboard");
    }
  }, [user, router]);

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      await signInWithEmail(email);
      setMessage("Check your email for the magic link!");
      setEmail("");
    } catch (error) {
      console.error(error);
      setMessage("Login failed. Please try again.");
    }
  };

  return (
    <>
      <Head>
        <title>NordBalticum – Login</title>
      </Head>

      <div className="fullscreenContainer">
        <div className={`${styles.loginBox} glassBox fadeIn`} role="main" aria-label="Login form">
          <h1 className={styles.title}>Welcome to NordBalticum</h1>
          <p className={styles.subtitle}>Sign in with your email</p>

          <form onSubmit={handleLogin} className={styles.form}>
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className={styles.input}
            />
            <button type="submit" className={styles.button}>
              Send Magic Link
            </button>
          </form>

          {message && <p className={styles.message}>{message}</p>}
        </div>
      </div>
    </>
  );
          }

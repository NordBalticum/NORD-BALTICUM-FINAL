"use client";

import { useState } from "react";
import { useRouter } from "next/router";
import { useMagicLink } from "@/contexts/MagicLinkContext";
import styles from "@/styles/index.module.css";

export default function Home() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const { user, signInWithEmail } = useMagicLink();
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      await signInWithEmail(email);
      setMessage("✓ Magic link sent to your email.");
    } catch (error) {
      setMessage("Login error: " + error.message);
    }
  };

  if (user) {
    router.push("/dashboard");
    return null;
  }

  return (
    <div className="globalContainer">
      <div className="contentWrapper glassBox fadeIn">
        <h1 className={styles.title}>Welcome to NordBalticum</h1>
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
  );
        }

"use client";

import React, { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useMagicLink } from "@/contexts/MagicLinkContext";
import styles from "@/styles/index.module.css";
import background from "@/styles/background.module.css";

export default function Home() {
  const router = useRouter();
  const { user, signInWithMagicLink, signInWithGoogle, signOut } = useMagicLink();

  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState("");

  const handleSignIn = async (e) => {
    e.preventDefault();
    setMessage("");

    if (!email) {
      setMessage("Please enter a valid email.");
      return;
    }

    try {
      setStatus("loading");
      await signInWithMagicLink(email);
      setMessage("Check your inbox for the Magic Link.");
    } catch (err) {
      console.error(err);
      setMessage("Failed to send Magic Link.");
    } finally {
      setStatus("idle");
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setStatus("loading");
      await signInWithGoogle();
    } catch (err) {
      console.error("Google Auth failed:", err);
      setMessage("Google login failed. Make sure the OAuth credentials are correct.");
    } finally {
      setStatus("idle");
    }
  };

  return (
    <div className={`${styles.container} ${background.fullscreen}`}>
      <div className={styles.logoContainer}>
        <Image
          src="/icons/logo.svg"
          alt="NordBalticum Logo"
          width={240}
          height={240}
          className={styles.logo}
          priority
        />
      </div>

      <form onSubmit={handleSignIn} className={styles.loginBox}>
        <h1 className={styles.heading}>Welcome to NordBalticum</h1>
        <p className={styles.subheading}>Login with Email or Google</p>

        <input
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={status === "loading"}
          className={styles.input}
        />

        <button
          type="submit"
          disabled={status === "loading"}
          className={styles.buttonPrimary}
        >
          SEND MAGIC LINK
        </button>

        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={status === "loading"}
          className={styles.buttonGoogle}
        >
          <Image
            src="/icons/google-logo.png"
            alt="Google"
            width={18}
            height={18}
            style={{ marginRight: "8px" }}
          />
          LOGIN WITH GOOGLE
        </button>

        {message && <p className={styles.message}>{message}</p>}
      </form>
    </div>
  );
        }

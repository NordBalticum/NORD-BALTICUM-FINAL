"use client";

import React, { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useMagicLink } from "@/contexts/MagicLinkContext";
import styles from "@/styles/index.module.css";
import background from "@/styles/background.module.css";

export default function Home() {
  const router = useRouter();
  const { user, wallet, signInWithMagicLink, signInWithGoogle, signOut } = useMagicLink();

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
      console.error(err);
      setMessage("Google login failed.");
    } finally {
      setStatus("idle");
    }
  };

  const handleSignOut = async () => {
    try {
      setStatus("loading");
      await signOut();
      setMessage("You have been signed out.");
    } catch (err) {
      console.error(err);
      setMessage("Sign out failed.");
    } finally {
      setStatus("idle");
    }
  };

  return (
    <div className={`${styles.container} ${background.fullscreen}`}>
      <form onSubmit={handleSignIn} className={styles.loginBox}>
        <h1>NordBalticum</h1>
        <input
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={status === "loading"}
        />
        <button type="submit" disabled={status === "loading"}>Send Magic Link</button>
        <button type="button" onClick={handleGoogleSignIn} disabled={status === "loading"}>Login with Google</button>
        {user && <button type="button" onClick={handleSignOut}>Sign Out</button>}
        {message && <p>{message}</p>}
      </form>
    </div>
  );
        }

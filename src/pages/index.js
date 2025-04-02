"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useMagicLink } from "@/contexts/MagicLinkContext";
import styles from "@/styles/index.module.css";
import background from "@/styles/background.module.css";

export default function Home() {
  const router = useRouter();
  const { user, signInWithMagicLink, signInWithGoogle, signOut, fetchUserWallet } = useMagicLink();

  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState("");
  const [wallet, setWallet] = useState(null);

  // Fetch the user's wallet when a user is logged in
  useEffect(() => {
    if (user) {
      fetchUserWallet(user.email)
        .then((walletData) => setWallet(walletData))
        .catch((error) => console.error("Error loading wallet:", error));
    }
  }, [user, fetchUserWallet]);

  // Handles email sign-in
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

  // Handles Google OAuth sign-in
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

  // Handles user sign-out
  const handleSignOut = async () => {
    try {
      setStatus("loading");
      await signOut();
      setMessage("You have been signed out.");
      setWallet(null);
    } catch (err) {
      console.error(err);
      setMessage("Sign out failed.");
    } finally {
      setStatus("idle");
    }
  };

  return (
    <main className={`${styles.container} ${background.gradient}`}>
      <div className={styles.centerWrapper}>
        <div className={styles.logoContainer}>
          <Image
            src="/icons/logo.svg"
            alt="NordBalticum Logo"
            width={260}
            height={260}
            className={styles.logoImage}
            priority
          />
        </div>

        {!user ? (
          <section className={styles.loginBox}>
            <h1 className={styles.title}>Welcome to NordBalticum</h1>
            <p className={styles.subtitle}>Login with Email or Google</p>
            
            <form onSubmit={handleSignIn} className={styles.form}>
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={styles.input}
                disabled={status === "loading"}
                required
              />
              <button
                type="submit"
                className={styles.button}
                disabled={status === "loading"}
              >
                {status === "loading" ? "Sending..." : "Send Magic Link"}
              </button>
            </form>

            <button
              onClick={handleGoogleSignIn}
              className={styles.googleButton}
              disabled={status === "loading"}
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
          </section>
        ) : (
          <section className={styles.loggedInBox}>
            <h1 className={styles.title}>Hello, {user.email}</h1>
            <p className={styles.subtitle}>
              Your wallet: {wallet ? wallet.networks.bnb : "Loading..."}
            </p>
            <button onClick={handleSignOut} className={styles.logoutButton}>
              Sign Out
            </button>
          </section>
        )}

        {message && <p className={styles.message}>{message}</p>}
      </div>
    </main>
  );
        }

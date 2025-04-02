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
  const [state, setState] = useState({
    status: "idle",
    message: "",
    wallet: null,
  });

  useEffect(() => {
    if (user) {
      fetchUserWallet(user.email)
        .then((walletData) => setState((prev) => ({ ...prev, wallet: walletData })))
        .catch((error) => {
          console.error("Error loading wallet:", error);
          setState((prev) => ({ ...prev, message: "Failed to load wallet. Please try again." }));
        });
    }
  }, [user, fetchUserWallet]);

  const handleSignIn = async (e) => {
    e.preventDefault();
    setState({ ...state, message: "", status: "loading" });

    if (!email) {
      setState({ ...state, message: "Please enter a valid email.", status: "idle" });
      return;
    }

    try {
      await signInWithMagicLink(email);
      setState({ ...state, message: "Check your inbox for the Magic Link.", status: "idle" });
    } catch (err) {
      console.error("Failed to send Magic Link:", err);
      setState({ ...state, message: "Failed to send Magic Link. Please try again.", status: "idle" });
    }
  };

  const handleGoogleSignIn = async () => {
    setState({ ...state, status: "loading" });
    try {
      await signInWithGoogle();
      setState({ ...state, status: "idle" });
    } catch (err) {
      console.error("Google login failed:", err);
      setState({ ...state, message: "Google login failed. Please try again.", status: "idle" });
    }
  };

  const handleSignOut = async () => {
    setState({ ...state, status: "loading" });
    try {
      await signOut();
      setState({ user: null, wallet: null, status: "idle", message: "You have been signed out." });
    } catch (err) {
      console.error("Sign out failed:", err);
      setState({ ...state, message: "Sign out failed. Please try again.", status: "idle" });
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
                disabled={state.status === "loading"}
                required
              />
              <button
                type="submit"
                className={styles.button}
                disabled={state.status === "loading"}
              >
                {state.status === "loading" ? "Sending..." : "Send Magic Link"}
              </button>
            </form>

            <button
              onClick={handleGoogleSignIn}
              className={styles.googleButton}
              disabled={state.status === "loading"}
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
              Your wallet: {state.wallet ? state.wallet.networks.bnb : "Loading..."}
            </p>
            <button onClick={handleSignOut} className={styles.logoutButton}>
              Sign Out
            </button>
          </section>
        )}

        {state.message && <p className={styles.message}>{state.message}</p>}
      </div>
    </main>
  );
        }

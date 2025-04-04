"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion"; // ✅ Animacijoms
import { useAuth } from "@/contexts/AuthContext"; // ✅ Ultimate Auth
import styles from "@/styles/index.module.css";
import background from "@/styles/background.module.css";

export default function Home() {
  const router = useRouter();
  const { user, signInWithMagicLink, signInWithGoogle } = useAuth();

  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("idle"); // idle | loading | success | error
  const [message, setMessage] = useState("");
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") setIsClient(true);
  }, []);

  useEffect(() => {
    if (isClient && user) {
      router.replace("/dashboard");
    }
  }, [user, isClient, router]);

  const handleSignIn = async (e) => {
    e.preventDefault();
    setMessage("");

    if (!email || !email.includes("@")) {
      setStatus("error");
      setMessage("❌ Please enter a valid email address.");
      return;
    }

    try {
      setStatus("loading");
      await signInWithMagicLink(email);
      setStatus("success");
      setMessage("✅ Check your inbox for the Magic Link!");
    } catch (err) {
      console.error("❌ Magic Link Error:", err);
      setStatus("error");
      setMessage("❌ Failed to send Magic Link. Try again.");
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setStatus("loading");
      await signInWithGoogle();
    } catch (err) {
      console.error("❌ Google Auth Error:", err);
      setStatus("error");
      setMessage("❌ Google login failed. Try again.");
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
          {status === "loading" ? "SENDING..." : "SEND MAGIC LINK"}
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
          {status === "loading" ? "CONNECTING..." : "LOGIN WITH GOOGLE"}
        </button>

        {/* ✅ Animate success/error message */}
        <AnimatePresence>
          {message && (
            <motion.p
              key="message"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.4 }}
              className={
                status === "success"
                  ? styles.successMessage
                  : styles.errorMessage
              }
            >
              {message}
            </motion.p>
          )}
        </AnimatePresence>
      </form>
    </div>
  );
}

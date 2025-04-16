"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";

import { useAuth } from "@/contexts/AuthContext";
import styles from "@/styles/index.module.css";
import background from "@/styles/background.module.css";

export default function Home() {
  const router = useRouter();
  const { user, authLoading, signInWithMagicLink, signInWithGoogle } = useAuth();

  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState("");
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (user) {
      router.replace("/dashboard");
    }
  }, [authLoading, user, router]);

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
      setShowModal(true);
      setTimeout(() => setShowModal(false), 3500);
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

  if (authLoading) {
    return (
      <div className={styles.fullscreenCenter}>
        <div className={styles.spinner}></div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className={`${styles.container} ${background.fullscreen}`}
    >
      <div className={styles.logoContainer}>
        <Image
          src="/icons/logo.svg"
          alt="NordBalticum Logo"
          width={240}
          height={240}
          priority
          className={styles.logo}
        />
      </div>

      {/* ✅ Login forma – FINAL TOBULINTA */}
      <form
        onSubmit={handleSignIn}
        className={styles.loginBox}
        autoComplete="off"
      >
        <h1 className={styles.heading}>Welcome to NordBalticum</h1>
        <p className={styles.subheading}>Secure Web3 Banking</p>

        <fieldset
          disabled={status === "loading"}
          style={{ border: "none", padding: 0, margin: 0 }}
        >
          <input
            type="email"
            inputMode="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className={styles.input}
          />

          <button type="submit" className={styles.buttonPrimary}>
            {status === "loading" ? "SENDING..." : "SEND MAGIC LINK"}
          </button>

          <button
            type="button"
            onClick={handleGoogleSignIn}
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
        </fieldset>

        <AnimatePresence>
          {message && (
            <motion.p
              key="message"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.5 }}
              className={
                status === "success"
                  ? styles.successMessage
                  : styles.errorMessage
              }
              aria-live="polite"
            >
              {message}
            </motion.p>
          )}
        </AnimatePresence>
      </form>

      {/* ✅ Success Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            key="modal"
            className={styles.modalOverlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className={styles.modalContent}
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.8 }}
              transition={{ duration: 0.4 }}
            >
              <h2>✅ Magic Link Sent!</h2>
              <p>Check your email to complete login.</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

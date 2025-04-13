"use client";

// 1️⃣ Importai
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";

import { useAuth } from "@/contexts/AuthContext"; 
import styles from "@/styles/index.module.css";
import background from "@/styles/background.module.css";

export default function Home() {
  const router = useRouter();
  const { user, signInWithMagicLink, signInWithGoogle } = useAuth();

  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("idle"); // idle | loading | success | error
  const [message, setMessage] = useState("");
  const [isClient, setIsClient] = useState(false);
  const [showModal, setShowModal] = useState(false);

  // ✅ Saugi window patikra
  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsClient(true);
    }
  }, []);

  // ✅ Redirect į dashboard jei user jau prisijungęs
  useEffect(() => {
    if (isClient && user) {
      router.replace("/dashboard");
    }
  }, [isClient, user, router]);

  // ✅ Magic Link sign in
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

  // ✅ Google OAuth sign in
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

  // ✅ UI
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

      <form onSubmit={handleSignIn} className={styles.loginBox}>
        <h1 className={styles.heading}>Welcome to NordBalticum</h1>
        <p className={styles.subheading}>Secure Web3 Banking</p>

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
          {status === "loading" ? (
            <div className={styles.spinner}></div>
          ) : (
            "SEND MAGIC LINK"
          )}
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
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.5 }}
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

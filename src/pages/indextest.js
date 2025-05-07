"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";

import { useAuth } from "@/contexts/AuthContext";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import styles from "@/styles/indextest.module.css";

export default function Home() {
  const router = useRouter();
  const { user, authLoading, signInWithMagicLink, signInWithGoogle } = useAuth();

  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState("");
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (user) router.replace("/dashboard");
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
      setTimeout(() => setShowModal(false), 4000);
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
      className={styles.wrapper}
    >
      <motion.div
        className={styles.card}
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <Image
          src="/assets/logo.svg"
          alt="Nord Balticum Logo"
          width={80}
          height={80}
          className={styles.logo}
        />

        <h1 className={styles.title}>Welcome to Nord Balticum</h1>
        <p className={styles.subtitle}>Secure Web3 Wallet with MagicLink & Google</p>

        <form onSubmit={handleSignIn} className={styles.loginBox} autoComplete="off">
          <fieldset disabled={status === "loading"} style={{ border: "none", padding: 0 }}>
            <Input
              type="email"
              inputMode="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <Button type="submit" size="md" glow className="mt-4 w-full">
              {status === "loading" ? "SENDING..." : "SEND MAGIC LINK"}
            </Button>

            <Button
              type="button"
              variant="secondary"
              size="md"
              onClick={handleGoogleSignIn}
              className="mt-2 w-full"
            >
              <Image
                src="/icons/google-logo.png"
                alt="Google"
                width={18}
                height={18}
                style={{ marginRight: "8px" }}
              />
              {status === "loading" ? "CONNECTING..." : "LOGIN WITH GOOGLE"}
            </Button>
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
                  status === "success" ? styles.successMessage : styles.errorMessage
                }
                aria-live="polite"
              >
                {message}
              </motion.p>
            )}
          </AnimatePresence>
        </form>
      </motion.div>

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
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              transition={{ duration: 0.3 }}
            >
              <h2>✅ Magic Link Sent!</h2>
              <p>Check your inbox to complete login.</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

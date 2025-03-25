"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useMagicLink } from "@/contexts/MagicLinkContext";
import { useWebAuthn } from "@/contexts/WebAuthnContext";
import styles from "@/styles/index.module.css";

const HomePage = () => {
  const router = useRouter();
  const { user, signInWithEmail, loginWithGoogle, biometricEmail } = useMagicLink();
  const { loginWebAuthn } = useWebAuthn();

  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState("");
  const [autoBioTried, setAutoBioTried] = useState(false);

  // Redirect if user is already logged in
  useEffect(() => {
    if (user) {
      router.push("/dashboard");
    }
  }, [user]);

  // Try biometric login automatically if saved biometric email exists
  useEffect(() => {
    const autoLogin = async () => {
      if (!user && biometricEmail && !autoBioTried) {
        setAutoBioTried(true);
        setStatus("sending");
        setMessage("⏳ Logging in via biometrics...");
        const success = await loginWebAuthn(biometricEmail);
        if (success) {
          setStatus("success");
          setMessage("✅ Logged in via biometrics.");
        } else {
          setStatus("error");
          setMessage("❌ Biometric login failed.");
        }
      }
    };
    autoLogin();
  }, [user, biometricEmail]);

  // Handle email login
  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setMessage("");
    setStatus("sending");

    try {
      await signInWithEmail(email.trim());
      setStatus("sent");
      setMessage("✅ Magic Link sent! Check your email.");
      setEmail("");
    } catch (error) {
      console.error("❌ Magic Link Error:", error);
      setStatus("error");
      setMessage("❌ Failed to send link. Try again.");
    }
  };

  // Handle Google login
  const handleGoogleLogin = async () => {
    setStatus("sending");
    setMessage("⏳ Logging in with Google...");
    try {
      await loginWithGoogle();
      setStatus("success");
      setMessage("✅ Logged in via Google.");
    } catch (error) {
      console.error("❌ Google Login Error:", error);
      setStatus("error");
      setMessage("❌ Google login failed.");
    }
  };

  return (
    <main className={styles.container}>
      <div className={styles.centerWrapper}>
        <header className={styles.header}>
          <h1>Welcome to NordBalticum</h1>
          <p>Secure login with your email, Google, or biometrics</p>
        </header>

        <section className={styles.loginBox}>
          <form onSubmit={handleEmailLogin} className={styles.form}>
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              maxLength={80}
              autoComplete="email"
              className={styles.input}
            />
            <button type="submit" className={styles.button} disabled={status === "sending"}>
              {status === "sending" ? "Sending..." : "Send Magic Link"}
            </button>
          </form>

          <button onClick={handleGoogleLogin} className={styles.button} disabled={status === "sending"}>
            Login with Google
          </button>

          {biometricEmail && (
            <>
              <div className={styles.divider}>or</div>
              <button className={styles.button} onClick={() => loginWebAuthn(biometricEmail)} disabled={status === "sending"}>
                Login with Biometrics
              </button>
            </>
          )}

          {message && (
            <p className={status === "error" ? styles.error : styles.success}>
              {message}
            </p>
          )}
        </section>
      </div>
    </main>
  );
};

export default HomePage;

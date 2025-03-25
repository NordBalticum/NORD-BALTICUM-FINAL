"use client";

import { useState, useEffect } from "react";
import { useMagicLink } from "@/contexts/MagicLinkContext";
import { useRouter } from "next/router";
import styles from "@/styles/settings.module.css";

export default function Settings() {
  const { user, supabase } = useMagicLink();
  const router = useRouter();

  const [newEmail, setNewEmail] = useState("");
  const [status, setStatus] = useState("");
  const [biometricsEnabled, setBiometricsEnabled] = useState(false);

  // Tikrina ar biometrika aktyvuota
  useEffect(() => {
    const biometricEmail = localStorage.getItem("biometric_user");
    if (biometricEmail && user?.email === biometricEmail) {
      setBiometricsEnabled(true);
    }
  }, [user]);

  // El. pašto keitimas
  const handleEmailChange = async () => {
    setStatus("⏳ Sending confirmation link...");
    try {
      const { error } = await supabase.auth.updateUser({ email: newEmail });
      if (error) throw error;
      setStatus("✅ Confirmation link sent. Check your email.");
      setNewEmail("");
    } catch (err) {
      console.error(err);
      setStatus("❌ Failed to update email.");
    }
  };

  // Biometrikos įjungimas
  const toggleBiometrics = () => {
    if (!user?.email) return;
    if (!biometricsEnabled) {
      localStorage.setItem("biometric_user", user.email);
      setBiometricsEnabled(true);
    } else {
      localStorage.removeItem("biometric_user");
      setBiometricsEnabled(false);
    }
  };

  return (
    <div className="globalContainer scrollable">
      <div className={styles.wrapper}>
        <h1 className={styles.title}>SETTINGS</h1>

        {/* Email keitimas */}
        <div className={styles.box}>
          <h2 className={styles.label}>Change Email</h2>
          <input
            type="email"
            className={styles.input}
            placeholder="Enter new email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
          />
          <button className={styles.button} onClick={handleEmailChange}>
            Update Email
          </button>
          {status && (
            <p className={status.startsWith("✅") ? styles.success : styles.error}>
              {status}
            </p>
          )}
        </div>

        {/* Biometric Login */}
        <div className={styles.box}>
          <h2 className={styles.label}>Biometric Login</h2>
          <button className={styles.button} onClick={toggleBiometrics}>
            {biometricsEnabled ? "Disable Biometrics" : "Enable Biometrics"}
          </button>
          <p className={styles.note}>
            {biometricsEnabled
              ? "Biometric login is enabled for this device."
              : "You can enable fingerprint/FaceID login on this device."}
          </p>
        </div>

        {/* 2FA Placeholder */}
        <div className={styles.box}>
          <h2 className={styles.label}>Two-Factor Authentication (2FA)</h2>
          <button className={styles.button} disabled>
            Enable 2FA (coming soon)
          </button>
        </div>

        {/* Navigation */}
        <div className={styles.row}>
          <button onClick={() => router.push("/pages/help")} className={styles.linkBtn}>
            Help
          </button>
          <button onClick={() => router.push("/pages/history")} className={styles.linkBtn}>
            Transaction History
          </button>
        </div>
      </div>
    </div>
  );
}

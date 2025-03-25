"use client";

import { useState } from "react";
import { useMagicLink } from "@/contexts/MagicLinkContext";
import styles from "@/styles/settings.module.css";
import { useRouter } from "next/router";

export default function Settings() {
  const { user } = useMagicLink();
  const router = useRouter();
  const [newEmail, setNewEmail] = useState("");
  const [status, setStatus] = useState("");

  const handleEmailChange = async () => {
    try {
      const { data, error } = await supabase.auth.updateUser({ email: newEmail });
      if (error) throw error;
      setStatus("✅ Confirmation link sent to your new email.");
    } catch (err) {
      setStatus("❌ Failed to update email.");
    }
  };

  return (
    <div className="globalContainer">
      <div className={styles.wrapper}>
        <h1 className={styles.title}>SETTINGS</h1>

        {/* 2FA Placeholder */}
        <div className={styles.box}>
          <h2 className={styles.label}>Two-Factor Authentication (2FA)</h2>
          <button className={styles.button} disabled>
            Enable 2FA (coming soon)
          </button>
        </div>

        {/* Email Change */}
        <div className={styles.box}>
          <h2 className={styles.label}>Change Email</h2>
          <input
            className={styles.input}
            type="email"
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
          <h2 className={styles.label}>Biometric Login (Fingerprint/FaceID)</h2>
          <button className={styles.button} onClick={() => alert("Coming soon – Biometric integration")}>
            Enable Biometrics
          </button>
        </div>

        {/* Help / History Buttons */}
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

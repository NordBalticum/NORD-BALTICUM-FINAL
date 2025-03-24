"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useMagicLink } from "@/contexts/MagicLinkContext";
import { useBalance } from "@/contexts/BalanceContext";
import BottomNavigation from "@/components/BottomNavigation";
import styles from "@/styles/settings.module.css";

export default function SettingsPage() {
  const router = useRouter();
  const { user, wallet, changeEmail, requestAccountDeletion } = useMagicLink();
  const { balance, selectedNetwork } = useBalance();

  const [newEmail, setNewEmail] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user || !wallet) {
      router.push("/");
    }
  }, [user, wallet]);

  const handleEmailChange = async () => {
    setLoading(true);
    setStatus("Sending Magic Link...");
    try {
      await changeEmail(newEmail);
      setStatus("✅ Confirmation email sent. Check your inbox.");
    } catch (error) {
      console.error(error);
      setStatus("❌ Failed to send confirmation link.");
    } finally {
      setLoading(false);
      setNewEmail("");
    }
  };

  const handleDeleteRequest = async () => {
    setLoading(true);
    setStatus("⏳ Sending deletion request...");
    try {
      await requestAccountDeletion();
      setStatus("✅ Your request was submitted.");
    } catch (err) {
      setStatus("❌ Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!user || !wallet) return null;

  return (
    <div className="globalContainer">
      <div className={styles.wrapper}>
        <h1 className={styles.title}>Settings</h1>

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Wallet Info</h2>
          <p><strong>Address:</strong> {wallet.address}</p>
          <p><strong>Network:</strong> {selectedNetwork}</p>
          <p><strong>Balance:</strong> {balance} BNB</p>
        </div>

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Change Email</h2>
          <input
            type="email"
            placeholder="New email address"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            className={styles.input}
            disabled={loading}
          />
          <button
            className={styles.primaryButton}
            onClick={handleEmailChange}
            disabled={loading || !newEmail}
          >
            {loading ? "Sending..." : "Send Confirmation Link"}
          </button>
        </div>

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Account</h2>
          <button
            className={styles.dangerButton}
            onClick={handleDeleteRequest}
            disabled={loading}
          >
            Request Account Deletion
          </button>
        </div>

        {status && (
          <p className={status.startsWith("✅") ? styles.success : styles.error}>
            {status}
          </p>
        )}
      </div>

      <BottomNavigation />
    </div>
  );
}

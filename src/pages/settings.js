"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

import { useAuth } from "@/contexts/AuthContext"; // ✅ Ultimate Auth
import { supabase } from "@/utils/supabaseClient";

import styles from "@/styles/settings.module.css";
import background from "@/styles/background.module.css";

export default function SettingsPage() {
  const router = useRouter();
  const { user, wallet, signOut } = useAuth();

  const [emailInput, setEmailInput] = useState("");
  const [walletAddress, setWalletAddress] = useState("Loading...");
  const [isClient, setIsClient] = useState(false);
  const [copied, setCopied] = useState(false); // ✅ Kopijavimo pranešimui
  const [emailStatus, setEmailStatus] = useState(""); // ✅ Email update pranešimui

  // Patikrinam ar klientas
  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsClient(true);
    }
  }, []);

  // Užkraunam piniginės adresą
  useEffect(() => {
    if (!isClient || !wallet?.wallet?.address) return;
    setWalletAddress(wallet.wallet.address);
  }, [wallet, isClient]);

  // Email keitimas (Magic Link išsiuntimas)
  const handleChangeEmail = async () => {
    const email = emailInput.trim();
    if (!email) return alert("Please enter a new email.");

    try {
      const { error } = await supabase.auth.updateUser({ email });
      if (error) throw error;
      setEmailStatus("✅ Magic Link sent to new email address.");
      setEmailInput(""); // Išvalom lauką
    } catch (err) {
      setEmailStatus("❌ Error: " + err.message);
    } finally {
      setTimeout(() => setEmailStatus(""), 4000); // Po 4s išvalom pranešimą
    }
  };

  // Kopijuoti adresą
  const handleCopyWallet = () => {
    if (!walletAddress || walletAddress.includes("not") || walletAddress.includes("Error")) return;
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(walletAddress).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000); // Po 2s dingsta
      });
    }
  };

  // Atsijungimas
  const handleLogout = async () => {
    await signOut();
    router.replace("/");
  };

  if (!isClient || !user) {
    return <div className={styles.loading}>Loading profile...</div>;
  }

  return (
    <main className={`${styles.container} ${background.gradient}`}>
      <div className={styles.box}>
        <Image
          src="/icons/logo.svg"
          alt="NordBalticum Logo"
          width={220}
          height={80}
          priority
          className={styles.logo}
        />

        {/* Wallet Info */}
        <div
          className={styles.walletBox}
          onClick={handleCopyWallet}
          title="Click to copy wallet address"
        >
          <p className={styles.walletLabel}>Your Wallet:</p>
          <p className={styles.walletAddress}>{walletAddress}</p>
          {copied && <p className={styles.copyStatus}>✅ Copied!</p>}
        </div>

        {/* Change Email Section */}
        <div className={styles.section}>
          <h4>Change Email</h4>
          <p className={styles.currentEmail}>
            Current: <strong>{user.email}</strong>
          </p>
          <input
            type="email"
            placeholder="New email address"
            value={emailInput}
            onChange={(e) => setEmailInput(e.target.value)}
            className={styles.input}
          />
          <button
            className={styles.button}
            onClick={handleChangeEmail}
            disabled={!emailInput.trim()}
          >
            Send Magic Link
          </button>
          {emailStatus && (
            <p className={styles.emailStatus}>
              {emailStatus}
            </p>
          )}
        </div>

        {/* Logout */}
        <button className={styles.logout} onClick={handleLogout}>
          Log Out
        </button>
      </div>
    </main>
  );
}

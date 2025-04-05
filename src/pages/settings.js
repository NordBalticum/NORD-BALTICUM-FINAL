"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

import { useAuth } from "@/contexts/AuthContext"; 
import { supabase } from "@/utils/supabaseClient";

import styles from "@/styles/settings.module.css";
import background from "@/styles/background.module.css";

export default function SettingsPage() {
  const router = useRouter();
  const { user, wallet, signOut } = useAuth();

  const [emailInput, setEmailInput] = useState("");
  const [walletAddress, setWalletAddress] = useState("");
  const [isClient, setIsClient] = useState(false);
  const [copied, setCopied] = useState(false);
  const [emailStatus, setEmailStatus] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsClient(true);
    }
  }, []);

  useEffect(() => {
    if (isClient && wallet?.wallet?.address) {
      setWalletAddress(wallet.wallet.address);
    }
  }, [wallet, isClient]);

  const handleChangeEmail = async () => {
    const email = emailInput.trim();
    if (!email) {
      setEmailStatus("❌ Please enter a new email address.");
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({ email });
      if (error) throw error;
      setEmailStatus("✅ Magic Link sent to new email address.");
      setEmailInput("");
    } catch (error) {
      console.error("Email update error:", error.message);
      setEmailStatus(`❌ ${error.message}`);
    } finally {
      setTimeout(() => setEmailStatus(""), 4000);
    }
  };

  const handleCopyWallet = async () => {
    if (!walletAddress) return;
    try {
      await navigator.clipboard.writeText(walletAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Clipboard error:", err);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
      router.replace("/");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  if (!isClient || !user || !wallet?.wallet?.address) {
    return <div className={styles.loading}>Loading profile...</div>;
  }

  return (
    <main className={`${styles.container} ${background.gradient}`}>
      <div className={styles.box}>
        {/* Logo */}
        <Image
          src="/icons/logo.svg"
          alt="NordBalticum Logo"
          width={220}
          height={80}
          priority
          className={styles.logo}
        />

        {/* Wallet */}
        <div
          className={styles.walletBox}
          onClick={handleCopyWallet}
          title="Click to copy wallet address"
        >
          <p className={styles.walletLabel}>Your Wallet:</p>
          <p className={styles.walletAddress}>
            {walletAddress}
          </p>
          {copied && <p className={styles.copyStatus}>✅ Copied!</p>}
        </div>

        {/* Email */}
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

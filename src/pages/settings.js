"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

import { useMagicLink } from "@/contexts/MagicLinkContext";
import styles from "@/styles/settings.module.css";
import background from "@/styles/background.module.css";

export default function SettingsPage() {
  const router = useRouter();
  const { user, logout, fetchUserWallet, updateEmail } = useMagicLink();

  const [emailInput, setEmailInput] = useState("");
  const [walletAddress, setWalletAddress] = useState("");

  useEffect(() => {
    if (user?.email) {
      fetchUserWallet(user.email)
        .then((addr) => setWalletAddress(addr || "Wallet not found"))
        .catch(console.error);
    }
  }, [user, fetchUserWallet]);

  const handleChangeEmail = async () => {
    if (!emailInput.trim()) {
      alert("Please enter a new email.");
      return;
    }

    const result = await updateEmail(emailInput.trim());
    if (result.success) {
      alert("✅ Magic Link sent to new email.");
    } else {
      alert("❌ Error: " + result.message);
    }
  };

  const handleCopyWallet = () => {
    if (walletAddress && walletAddress !== "Wallet not found") {
      navigator.clipboard.writeText(walletAddress);
      alert("✅ Wallet address copied.");
    }
  };

  const handleLogout = async () => {
    await logout();
    router.replace("/");
  };

  if (!user) return <div className={styles.loading}>Loading profile...</div>;

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

        <div
          className={styles.walletBox}
          onClick={handleCopyWallet}
          title="Click to copy wallet address"
        >
          <p className={styles.walletLabel}>Your Wallet:</p>
          <p className={styles.walletAddress}>{walletAddress}</p>
        </div>

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
          <button className={styles.button} onClick={handleChangeEmail}>
            Send Magic Link
          </button>
        </div>

        <button className={styles.logout} onClick={handleLogout}>
          Log Out
        </button>
      </div>
    </main>
  );
}

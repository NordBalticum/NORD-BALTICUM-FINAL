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
  const [walletAddress, setWalletAddress] = useState("Loading...");
  const [isClient, setIsClient] = useState(false);

  // SSR-safe hook
  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsClient(true);
    }
  }, []);

  // Wallet fetch only on client
  useEffect(() => {
    if (!isClient || !user?.email) return;

    fetchUserWallet(user.email)
      .then((addr) => {
        setWalletAddress(addr || "Wallet not found");
      })
      .catch((err) => {
        console.error("Wallet fetch error:", err);
        setWalletAddress("Error fetching wallet");
      });
  }, [user, fetchUserWallet, isClient]);

  const handleChangeEmail = async () => {
    const email = emailInput.trim();
    if (!email) {
      alert("Please enter a new email.");
      return;
    }

    const result = await updateEmail(email);
    if (result?.success) {
      alert("✅ Magic Link sent to new email.");
    } else {
      alert("❌ Error: " + (result?.message || "Unknown error"));
    }
  };

  const handleCopyWallet = () => {
    if (!walletAddress || walletAddress.includes("not") || walletAddress.includes("Error")) return;
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(walletAddress).then(() => {
        alert("✅ Wallet address copied.");
      });
    }
  };

  const handleLogout = async () => {
    await logout();
    router.replace("/");
  };

  if (!isClient || !user) return <div className={styles.loading}>Loading profile...</div>;

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

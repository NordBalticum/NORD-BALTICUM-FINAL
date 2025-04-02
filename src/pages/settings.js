"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useMagicLink } from "@/contexts/MagicLinkContext";

import AvatarDisplay from "@/components/AvatarDisplay";
import SuccessModal from "@/components/SuccessModal";

import styles from "@/styles/settings.module.css";
import background from "@/styles/background.module.css";

export default function SettingsPage() {
  const router = useRouter();
  const { user, logout, fetchUserWallet, updateEmail } = useMagicLink();

  const [emailInput, setEmailInput] = useState("");
  const [success, setSuccess] = useState(false);
  const [walletAddress, setWalletAddress] = useState(null);

  React.useEffect(() => {
    if (user) {
      fetchUserWallet(user.email).then(setWalletAddress).catch(console.error);
    }
  }, [user, fetchUserWallet]);

  const handleChangeEmail = async () => {
    if (!emailInput.trim()) return alert("Please enter a new email.");

    const result = await updateEmail(emailInput.trim());
    if (result.success) {
      alert("✅ Magic Link has been sent to your new email.");
    } else {
      alert("❌ Error: " + result.message);
    }
  };

  const handleCopy = () => {
    if (walletAddress) {
      navigator.clipboard.writeText(walletAddress);
      alert("✅ Wallet address copied to clipboard.");
    }
  };

  const handleLogout = async () => {
    await logout();
    router.replace("/");
  };

  if (!user || !walletAddress) {
    return <div className={styles.loading}>Loading Profile...</div>;
  }

  return (
    <main className={`${styles.container} ${background.gradient}`}>
      <div className={styles.box}>
        <h2 className={styles.heading}>Profile Settings</h2>

        <div className={styles.avatarContainer}>
          <AvatarDisplay walletAddress={walletAddress} size={80} />
          <p className={styles.avatarText}>Avatar</p>
        </div>

        <p><strong>Email:</strong> {user.email}</p>

        <div className={styles.walletBox} onClick={handleCopy} title="Click to copy">
          <span><strong>Wallet Address:</strong></span>
          <span className={styles.walletAddress}>{walletAddress}</span>
        </div>

        <hr />

        <div className={styles.section}>
          <h4>Change Email</h4>
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

        <hr />

        <button className={styles.logout} onClick={handleLogout}>
          Log Out
        </button>
      </div>

      {success && (
        <SuccessModal
          message="Email updated successfully!"
          onClose={() => setSuccess(false)}
        />
      )}
    </main>
  );
}

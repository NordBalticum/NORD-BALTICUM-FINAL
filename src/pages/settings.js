"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

import { useMagicLink } from "@/contexts/MagicLinkContext";
import { useWallet } from "@/contexts/WalletContext";

import StarsBackground from "@/components/StarsBackground";
import AvatarDisplay from "@/components/AvatarDisplay";
import AvatarModalPicker from "@/components/AvatarModalPicker";
import SuccessModal from "@/components/SuccessModal";

import { supabase } from "@/utils/supabaseClient";
import styles from "@/styles/settings.module.css";
import background from "@/styles/background.module.css";

export default function SettingsPage() {
  const router = useRouter();
  const { user, logout } = useMagicLink();
  const { publicKey } = useWallet();

  const [emailInput, setEmailInput] = useState("");
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [avatarKey, setAvatarKey] = useState(Date.now());
  const [success, setSuccess] = useState(false);

  const handleChangeEmail = async () => {
    if (!emailInput.trim()) return alert("Please enter a new email.");

    const { error } = await supabase.auth.updateUser({ email: emailInput.trim() });

    if (error) alert("❌ Error: " + error.message);
    else alert("✅ Magic Link has been sent to your new email.");
  };

  const handleCopy = () => {
    if (publicKey) {
      navigator.clipboard.writeText(publicKey);
      alert("✅ Wallet address copied to clipboard.");
    }
  };

  const handleLogout = async () => {
    await logout();
    router.replace("/");
  };

  const handleAvatarChange = () => {
    setAvatarKey(Date.now());
    setShowAvatarModal(false);
    setSuccess(true);
  };

  if (!user || !publicKey) {
    return <div className={styles.loading}>Loading Profile...</div>;
  }

  return (
    <main className={`${styles.container} ${background.gradient}`}>
      <StarsBackground />

      <div className={styles.box}>
        <h2 className={styles.heading}>Profile Settings</h2>

        <div
          className={styles.avatarContainer}
          onClick={() => setShowAvatarModal(true)}
          title="Click to change avatar"
        >
          <AvatarDisplay walletAddress={publicKey} size={80} key={avatarKey} />
          <p className={styles.avatarText}>Change Avatar</p>
        </div>

        <p><strong>Email:</strong> {user.email}</p>

        <div className={styles.walletBox} onClick={handleCopy} title="Click to copy">
          <span><strong>Wallet Address:</strong></span>
          <span className={styles.walletAddress}>{publicKey}</span>
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

      {showAvatarModal && (
        <AvatarModalPicker onClose={handleAvatarChange} onSelect={() => {}} />
      )}

      {success && (
        <SuccessModal
          message="Avatar updated successfully!"
          onClose={() => setSuccess(false)}
        />
      )}
    </main>
  );
}

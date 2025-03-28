"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useMagicLink } from "@/contexts/MagicLinkContext";
import { useWallet } from "@/contexts/WalletContext";

import StarsBackground from "@/components/StarsBackground";
import AvatarModalPicker from "@/components/AvatarModalPicker";
import AvatarDisplay from "@/components/AvatarDisplay";
import SuccessModal from "@/components/SuccessModal";

import styles from "@/styles/settings.module.css";
import { supabase } from "@/lib/supabase";

export default function SettingsPage() {
  const router = useRouter();
  const { user, signOut } = useMagicLink();
  const { wallet } = useWallet();

  const [emailInput, setEmailInput] = useState("");
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [avatarKey, setAvatarKey] = useState(Date.now());
  const [success, setSuccess] = useState(false);

  const handleChangeEmail = async () => {
    if (!emailInput) return alert("Please enter a new email.");
    const { error } = await supabase.auth.updateUser({ email: emailInput });
    if (error) alert("Error: " + error.message);
    else alert("✅ Magic Link has been sent to your new email.");
  };

  const handleCopy = () => {
    if (wallet?.address) {
      navigator.clipboard.writeText(wallet.address);
      alert("✅ Wallet address copied to clipboard.");
    }
  };

  const handleLogout = async () => {
    await signOut();
    router.replace("/");
  };

  const handleAvatarChange = () => {
    setAvatarKey(Date.now());
    setShowAvatarModal(false);
    setSuccess(true);
  };

  return (
    <div className={styles.container}>
      <StarsBackground />
      <div className={styles.box}>
        <h2 className={styles.heading}>Profile Settings</h2>

        <div
          className={styles.avatarContainer}
          onClick={() => setShowAvatarModal(true)}
          title="Click to change avatar"
        >
          <AvatarDisplay walletAddress={wallet?.address} size={80} key={avatarKey} />
          <p className={styles.avatarText}>Change Avatar</p>
        </div>

        <p><strong>Email:</strong> {user?.email || "Unknown"}</p>

        <div
          className={styles.walletBox}
          onClick={handleCopy}
          title="Click to copy"
        >
          <span><strong>Wallet Address:</strong></span>
          <span className={styles.walletAddress}>
            {wallet?.address || "Unavailable"}
          </span>
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
        <AvatarModalPicker
          onClose={handleAvatarChange}
          onSelect={() => {}}
        />
      )}

      {success && (
        <SuccessModal
          message="Avatar updated successfully!"
          onClose={() => setSuccess(false)}
        />
      )}
    </div>
  );
}

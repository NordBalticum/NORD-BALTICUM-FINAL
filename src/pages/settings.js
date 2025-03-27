"use client";

import React, { useState, useEffect } from "react";
import { useMagicLink } from "@/contexts/MagicLinkContext";
import { useRouter } from "next/router";
import StarsBackground from "@/components/StarsBackground";
import AvatarModalPicker from "@/components/AvatarModalPicker";
import AvatarDisplay from "@/components/AvatarDisplay";
import styles from "@/styles/settings.module.css";

export default function SettingsPage() {
  const { user, wallet, biometricEmail, logout, supabase } = useMagicLink();
  const router = useRouter();

  const [emailInput, setEmailInput] = useState("");
  const [walletAddress, setWalletAddress] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [avatarKey, setAvatarKey] = useState(Date.now());

  useEffect(() => {
    if (wallet?.address) setWalletAddress(wallet.address);
  }, [wallet]);

  const handleChangeEmail = async () => {
    if (!emailInput) return alert("Please enter a new email.");
    const { error } = await supabase.auth.updateUser({ email: emailInput });
    if (error) alert("Error: " + error.message);
    else alert("Magic Link has been sent to your new email.");
  };

  const handleDeleteRequest = () => {
    if (!confirmDelete) return setConfirmDelete(true);
    alert("Account deletion request sent. (mock)");
  };

  const clearBiometric = () => {
    localStorage.removeItem("biometric_user");
    alert("Biometric login disabled.");
    window.location.reload();
  };

  const enableBiometric = () => {
    if (!user?.email) return;
    localStorage.setItem("biometric_user", user.email);
    alert("Biometric login enabled.");
    window.location.reload();
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(walletAddress);
    alert("Wallet address copied!");
  };

  const handleLogout = async () => {
    await logout();
    router.replace("/");
  };

  const handleAvatarChange = () => {
    setAvatarKey(Date.now());
    setShowAvatarModal(false);
  };

  return (
    <div className={styles.container}>
      <StarsBackground />
      <div className={styles.box}>
        <h2 className={styles.heading}>Profile Settings</h2>

        <div className={styles.avatarContainer} onClick={() => setShowAvatarModal(true)} title="Click to change avatar">
          <AvatarDisplay walletAddress={wallet?.address} size={80} key={avatarKey} />
          <p className={styles.avatarText}>Change Avatar</p>
        </div>

        <p><strong>Email:</strong> {user?.email}</p>

        <div className={styles.walletBox} onClick={handleCopy} title="Click to copy">
          <span><strong>Wallet Address:</strong></span>
          <span className={styles.walletAddress}>{walletAddress || "Unavailable"}</span>
        </div>

        <div>
          <strong>Biometric Login:</strong>{" "}
          {biometricEmail ? (
            <>
              <span>Enabled ({biometricEmail})</span>
              <button className={styles.smallButton} onClick={clearBiometric}>
                Disable
              </button>
            </>
          ) : (
            <button className={styles.smallButton} onClick={enableBiometric}>
              Enable Biometric Login
            </button>
          )}
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

        <div className={styles.section}>
          <h4>Account Deletion</h4>
          <button className={styles.danger} onClick={handleDeleteRequest}>
            {confirmDelete ? "Confirm Deletion?" : "Request Deletion"}
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
    </div>
  );
}

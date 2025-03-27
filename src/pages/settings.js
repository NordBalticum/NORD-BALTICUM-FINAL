"use client";

import React, { useState, useEffect } from "react";
import { useMagicLink } from "@/contexts/MagicLinkContext";
import { useRouter } from "next/router";
import styles from "@/styles/settings.module.css";

const SettingsPage = () => {
  const {
    user,
    wallet,
    biometricEmail,
    logout,
    supabase,
  } = useMagicLink();

  const router = useRouter();

  const [emailInput, setEmailInput] = useState("");
  const [walletAddress, setWalletAddress] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (wallet?.address) setWalletAddress(wallet.address);
  }, [wallet]);

  const handleChangeEmail = async () => {
    if (!emailInput) return alert("Įveskite naują el. paštą");
    const { error } = await supabase.auth.updateUser({ email: emailInput });
    if (error) alert("Klaida: " + error.message);
    else alert("Magic Link išsiųstas į naują el. paštą.");
  };

  const handleDeleteRequest = () => {
    if (!confirmDelete) return setConfirmDelete(true);
    alert("Paskyros ištrynimo prašymas išsiųstas (mock).");
  };

  const clearBiometric = () => {
    localStorage.removeItem("biometric_user");
    alert("Biometrinė informacija pašalinta");
    window.location.reload();
  };

  const handleLogout = async () => {
    await logout();
    router.replace("/");
  };

  return (
    <div className={styles.container}>
      <div className={styles.box}>
        <h2>Profile Settings</h2>

        <p><strong>Email:</strong> {user?.email}</p>
        <p><strong>Wallet Address:</strong> {walletAddress || "Unavailable"}</p>
        <p>
          <strong>Biometric Login:</strong>{" "}
          {biometricEmail ? (
            <>
              <span>Enabled ({biometricEmail})</span>
              <button className={styles.smallButton} onClick={clearBiometric}>
                Disable
              </button>
            </>
          ) : (
            "Not Active"
          )}
        </p>

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
    </div>
  );
};

export default SettingsPage;

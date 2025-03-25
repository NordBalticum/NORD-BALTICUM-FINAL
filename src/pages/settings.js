"use client";

import React, { useState, useEffect } from "react";
import { useMagicLink } from "@/contexts/MagicLinkContext";
import styles from "@/styles/settings.module.css";

const SettingsPage = () => {
  const {
    user,
    wallet,
    biometricEmail,
    logout,
    supabase,
  } = useMagicLink();

  const [emailInput, setEmailInput] = useState("");
  const [walletAddress, setWalletAddress] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (wallet?.address) setWalletAddress(wallet.address);
  }, [wallet]);

  const handleChangeEmail = async () => {
    if (!emailInput) return alert("Įveskite naują el. paštą");
    const { error } = await supabase.auth.updateUser({
      email: emailInput,
    });
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

  return (
    <div className={styles.container}>
      <div className={styles.box}>
        <h2>Profilio nustatymai</h2>

        <p><strong>El. paštas:</strong> {user?.email}</p>
        <p><strong>Wallet adresas:</strong> {walletAddress || "Nerastas"}</p>
        <p>
          <strong>Biometrinis login:</strong>{" "}
          {biometricEmail ? (
            <>
              <span>Aktyvuotas ({biometricEmail})</span>
              <button className={styles.smallButton} onClick={clearBiometric}>
                Išjungti
              </button>
            </>
          ) : (
            "Neaktyvus"
          )}
        </p>

        <hr />

        <div className={styles.section}>
          <h4>Keisti el. paštą</h4>
          <input
            type="email"
            placeholder="Naujas el. paštas"
            value={emailInput}
            onChange={(e) => setEmailInput(e.target.value)}
            className={styles.input}
          />
          <button className={styles.button} onClick={handleChangeEmail}>
            Siųsti Magic Link
          </button>
        </div>

        <hr />

        <div className={styles.section}>
          <h4>Paskyros ištrynimas</h4>
          <button
            className={styles.danger}
            onClick={handleDeleteRequest}
          >
            {confirmDelete ? "Tikrai ištrinti?" : "Pateikti prašymą ištrinti"}
          </button>
        </div>

        <hr />

        <button className={styles.logout} onClick={logout}>
          Atsijungti
        </button>
      </div>
    </div>
  );
};

export default SettingsPage;

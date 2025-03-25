"use client";

import styles from "@/styles/vault.module.css";
import { useState } from "react";

export default function Vault() {
  const [recoveryCode, setRecoveryCode] = useState("A1B2-C3D4-E5F6-G7H8");
  const [enabled, setEnabled] = useState(false);

  const toggleVault = () => {
    setEnabled(!enabled);
  };

  return (
    <div className={styles.wrapper}>
      <h1 className={styles.title}>VAULT SECURITY</h1>
      <p className={styles.subtitle}>
        Protect your assets with advanced vault encryption.
      </p>

      <div className={styles.vaultBorder}>
        Vault Status:{" "}
        <strong style={{ color: enabled ? "#00ffaa" : "#ff5e5e" }}>
          {enabled ? "ENABLED" : "DISABLED"}
        </strong>
      </div>

      <button onClick={toggleVault} className={styles.button}>
        {enabled ? "DISABLE VAULT" : "ENABLE VAULT"}
      </button>

      <div className={styles.vaultBorder}>
        Recovery Code: <br />
        <code>{recoveryCode}</code>
      </div>

      <input
        type="password"
        placeholder="Vault Access Password"
        className={styles.input}
      />

      <button className={styles.button}>Save Access</button>
    </div>
  );
}

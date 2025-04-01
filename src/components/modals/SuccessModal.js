"use client";

import React from "react";
import styles from "./successmodal.module.css";

const explorers = {
  bnb: "https://bscscan.com/tx/",
  tbnb: "https://testnet.bscscan.com/tx/",
  eth: "https://etherscan.io/tx/",
  matic: "https://polygonscan.com/tx/",
  avax: "https://snowtrace.io/tx/",
};

export default function SuccessModal({ message, txHash, networkKey, onClose }) {
  const explorerUrl = explorers[networkKey?.toLowerCase()] || "";

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(txHash);
      alert("Transaction hash copied!");
    } catch (err) {
      console.error("❌ Copy failed:", err.message);
    }
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <h2 className={styles.title}>Success</h2>
        <p className={styles.message}>{message}</p>

        {txHash && (
          <div className={styles.txContainer}>
            <p className={styles.txLabel}>Transaction Hash:</p>
            <div className={styles.txBox}>
              <code>{txHash.slice(0, 12)}...{txHash.slice(-8)}</code>
              <button className={styles.copyButton} onClick={handleCopy}>
                Copy
              </button>
            </div>

            {explorerUrl && (
              <a
                href={`${explorerUrl}${txHash}`}
                className={styles.explorerLink}
                target="_blank"
                rel="noopener noreferrer"
              >
                View on Block Explorer
              </a>
            )}
          </div>
        )}

        <button className={styles.closeButton} onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
}

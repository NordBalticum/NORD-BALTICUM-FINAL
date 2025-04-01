// components/modals/SuccessModal.js

import React from "react";
import styles from "./SuccessModal.module.css";

export default function SuccessModal({ message, txHash, networkKey, onClose }) {
  const explorerBase = {
    bnb: "https://bscscan.com/tx/",
    tbnb: "https://testnet.bscscan.com/tx/",
    eth: "https://etherscan.io/tx/",
    matic: "https://polygonscan.com/tx/",
    avax: "https://snowtrace.io/tx/",
  }[networkKey];

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <h2 className={styles.title}>{message}</h2>
        {txHash && explorerBase && (
          <p className={styles.hash}>
            <a href={`${explorerBase}${txHash}`} target="_blank" rel="noopener noreferrer">
              View on Explorer
            </a>
          </p>
        )}
        <button className={styles.closeBtn} onClick={onClose}>Close</button>
      </div>
    </div>
  );
}

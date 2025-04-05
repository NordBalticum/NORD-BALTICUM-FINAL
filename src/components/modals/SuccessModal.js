"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import styles from "@/components/modals/modalstyle.module.css";

const explorers = {
  eth: "https://etherscan.io/tx/",
  bnb: "https://bscscan.com/tx/",
  tbnb: "https://testnet.bscscan.com/tx/",
  matic: "https://polygonscan.com/tx/",
  avax: "https://snowtrace.io/tx/",
};

const networkNames = {
  eth: "Ethereum",
  bnb: "Binance Smart Chain",
  tbnb: "Binance Smart Chain Testnet",
  matic: "Polygon",
  avax: "Avalanche",
};

export default function SuccessModal({ message, txHash, networkKey, onClose }) {
  const explorerBase = explorers[networkKey?.toLowerCase()] || "";
  const networkName = networkNames[networkKey?.toLowerCase()] || "Explorer";

  const transactionLink = explorerBase && txHash ? `${explorerBase}${txHash}` : null;

  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 5000); // Auto-close po 5s
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <motion.div
      className={styles.overlay}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
    >
      <motion.div
        className={styles.modal}
        initial={{ scale: 0.8 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
      >
        <h2 className={styles.title}>Success!</h2>
        <p className={styles.message}>{message}</p>

        {transactionLink && (
          <a
            href={transactionLink}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.txLink}
          >
            View Transaction on {networkName}
          </a>
        )}

        <button className={styles.closeButton} onClick={onClose}>
          Close
        </button>
      </motion.div>
    </motion.div>
  );
}

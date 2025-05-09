"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import styles from "@/components/modals/successmodal.module.css";

const getExplorerLink = (network, txHash) => {
  const map = {
    eth: "https://etherscan.io/tx/",
    bnb: "https://bscscan.com/tx/",
    tbnb: "https://testnet.bscscan.com/tx/",
    matic: "https://polygonscan.com/tx/",
    avax: "https://snowtrace.io/tx/",
  };
  return map[network] ? `${map[network]}${txHash}` : "";
};

const networkShortName = (network) => ({
  eth: "Etherscan",
  bnb: "BscScan",
  tbnb: "BscScan Testnet",
  matic: "PolygonScan",
  avax: "Snowtrace",
}[network] || "Explorer");

export default function SuccessModal({ message = "Transaction Successful!", onClose, transactionHash, network }) {
  const explorerLink = getExplorerLink(network, transactionHash);

  useEffect(() => {
    const timer = setTimeout(() => typeof onClose === "function" && onClose(), 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <motion.div
      className={styles.overlay}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className={styles.modal}
        initial={{ scale: 0.8 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.8 }}
        transition={{ type: "spring", stiffness: 220, damping: 22 }}
      >
        <button className={styles.closeBtn} onClick={onClose}>×</button>

        <h2 className={styles.modalTitle}>Transaction Completed</h2>

        <p className={styles.messageText}>✅ {message}</p>

        {transactionHash && explorerLink && (
          <a
            href={explorerLink}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.explorerBtn}
          >
            🔗 View on {networkShortName(network)}
          </a>
        )}

        <div className={styles.actions}>
          <button className={styles.actionBtn} onClick={onClose}>Close</button>
        </div>
      </motion.div>
    </motion.div>
  );
}

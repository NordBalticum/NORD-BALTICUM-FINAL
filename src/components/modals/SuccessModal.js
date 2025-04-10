"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import styles from "@/components/modals/successmodal.module.css"; // Tavo modal CSS

// ✅ Tikslūs explorer linkai pagal tinklą
const getExplorerLink = (network, txHash) => {
  switch (network) {
    case "eth":
      return `https://etherscan.io/tx/${txHash}`;
    case "bnb":
      return `https://bscscan.com/tx/${txHash}`;
    case "tbnb":
      return `https://testnet.bscscan.com/tx/${txHash}`;
    case "matic":
      return `https://polygonscan.com/tx/${txHash}`;
    case "avax":
      return `https://snowtrace.io/tx/${txHash}`;
    default:
      return "";
  }
};

// ✅ Draugiški explorer vardai
const networkShortName = (network) => {
  const names = {
    eth: "Etherscan",
    bnb: "BscScan",
    tbnb: "BscScan Testnet",
    matic: "PolygonScan",
    avax: "Snowtrace",
  };
  return names[network] || "Explorer";
};

export default function SuccessModal({
  message = "✅ Transaction Successful!",
  onClose = () => {},
  transactionHash,
  network,
}) {
  const explorerLink = getExplorerLink(network, transactionHash);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (typeof onClose === "function") {
        onClose();
      }
    }, 5000);

    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <motion.div
      className={styles.overlay}
      style={{
        background: "transparent",
        pointerEvents: "none",
      }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className={styles.confirmModal}
        style={{
          pointerEvents: "auto",
        }}
        initial={{ scale: 0.8 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.8 }}
        transition={{ duration: 0.4 }}
      >
        {/* ❌ Close Button */}
        <button
          onClick={typeof onClose === "function" ? onClose : () => {}}
          style={{
            position: "absolute",
            top: "12px",
            right: "14px",
            background: "transparent",
            border: "none",
            fontSize: "1.5rem",
            color: "#ffffff",
            cursor: "pointer",
          }}
        >
          ✖
        </button>

        {/* ✅ Modal Content */}
        <div className={styles.modalTitle}>Transaction Completed!</div>

        <div className={styles.modalInfo} style={{ textAlign: "center" }}>
          <p
            style={{
              color: "#00ff00",
              fontWeight: "600",
              fontSize: "1.1rem",
              marginBottom: "20px",
            }}
          >
            {message}
          </p>

          {/* ✅ View on Explorer Button */}
          {transactionHash && explorerLink && (
            <a
              href={explorerLink}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.explorerButton}
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "#00bfff",
                color: "white",
                padding: "12px 24px",
                borderRadius: "12px",
                fontWeight: "600",
                textDecoration: "none",
                fontSize: "1rem",
                transition: "background-color 0.3s ease, transform 0.3s ease",
                border: "2px solid white",
                marginTop: "10px",
              }}
            >
              <span style={{ marginRight: "8px", fontSize: "1.3rem" }}>🔗</span>
              View on {networkShortName(network)}
            </a>
          )}
        </div>

        {/* ✅ Close Button Bottom */}
        <div
          className={styles.modalActions}
          style={{ justifyContent: "center", marginTop: "24px" }}
        >
          <button
            className={styles.modalButton}
            onClick={typeof onClose === "function" ? onClose : () => {}}
          >
            Close
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

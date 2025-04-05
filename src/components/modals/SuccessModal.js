"use client";

import { motion } from "framer-motion";
import styles from "@/styles/send.module.css";

const explorerLinks = {
  bsc: "https://bscscan.com/tx/",
  tbnb: "https://testnet.bscscan.com/tx/",
  ethereum: "https://etherscan.io/tx/",
  polygon: "https://polygonscan.com/tx/",
  avalanche: "https://snowtrace.io/tx/",
};

export default function SuccessModal({ message = "✅ Transaction Successful!", txHash, networkKey, onClose = () => {} }) {
  const explorerBase = explorerLinks[networkKey] || "";
  const explorerUrl = txHash ? `${explorerBase}${txHash}` : "#";

  return (
    <motion.div
      className={styles.overlay}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className={styles.confirmModal}
        initial={{ scale: 0.8 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.8 }}
        transition={{ duration: 0.4 }}
      >
        {/* Close Button Top Right */}
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

        {/* Modal Content */}
        <div className={styles.modalTitle}>Transaction is Done!</div>

        <div className={styles.modalInfo} style={{ textAlign: "center" }}>
          <p style={{ color: "#00ff00", fontWeight: "600", fontSize: "1.1rem" }}>
            {message}
          </p>

          {txHash && (
            <a
              href={explorerUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                marginTop: "18px",
                display: "inline-block",
                color: "#00c6ff",
                textDecoration: "underline",
                fontWeight: "bold",
                fontSize: "1rem",
              }}
            >
              View on Explorer
            </a>
          )}
        </div>

        {/* Bottom Close Button */}
        <div className={styles.modalActions} style={{ justifyContent: "center", marginTop: "24px" }}>
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

"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import styles from "@/components/modals/successmodal.module.css";

export default function SuccessModal({
  message = "✅ Transaction Successful!",
  onClose = () => {},
}) {
  // ✅ Auto-close po 5 sekundžių
  useEffect(() => {
    const timer = setTimeout(() => {
      if (typeof onClose === "function") {
        onClose();
      }
    }, 5000);

    return () => clearTimeout(timer); // ✅ Saugu - išvalom timer
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
        {/* X mygtukas */}
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

        {/* Modal turinys */}
        <div className={styles.modalTitle}>Transaction is Done!</div>

        <div className={styles.modalInfo} style={{ textAlign: "center" }}>
          <p
            style={{
              color: "#00ff00",
              fontWeight: "600",
              fontSize: "1.1rem",
            }}
          >
            {message}
          </p>
        </div>

        {/* Bottom Close Button */}
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

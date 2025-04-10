"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import { FaTimesCircle } from "react-icons/fa";
import styles from "@/components/modals/errormodal.module.css"; // ✅ Premium stilius

export default function ErrorModal({ error, onClose }) {
  if (!error) return null;

  useEffect(() => {
    const timer = setTimeout(() => {
      if (typeof onClose === "function") {
        onClose(); // ✅ Auto-close po 5 sekundžių
      }
    }, 5000);

    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <motion.div
      className={styles.overlay}
      style={{
        background: "rgba(0, 0, 0, 0.75)", // ✅ Soft užtamsinimas
        pointerEvents: "none",
      }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className={styles.modal}
        style={{
          pointerEvents: "auto",
          background: "#1e1e1e",
          borderRadius: "16px",
          padding: "24px",
          textAlign: "center",
          color: "white",
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.25)",
        }}
        initial={{ scale: 0.8 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.8 }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
      >
        <FaTimesCircle size={56} color="#ff4d4f" style={{ marginBottom: "20px" }} />

        <h2 style={{
          fontSize: "1.5rem",
          fontWeight: "700",
          marginBottom: "12px",
          color: "#ff4d4f",
        }}>
          Error
        </h2>

        <p style={{
          fontSize: "1rem",
          color: "#ffffff",
          opacity: 0.85,
          marginBottom: "8px",
        }}>
          {error || "An unexpected error occurred."}
        </p>

        <p style={{
          fontSize: "0.85rem",
          color: "#aaaaaa",
          marginTop: "8px",
        }}>
          Closing automatically...
        </p>
      </motion.div>
    </motion.div>
  );
}

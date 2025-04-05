"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import { FaTimesCircle } from "react-icons/fa";
import styles from "@/components/modals/successmodal.module.css"; // ✅ Naudojam tą patį stilių!

export default function ErrorModal({ error, onRetry }) {
  if (!error) return null;

  useEffect(() => {
    const timeout = setTimeout(() => {
      onRetry(); // ✅ Auto-retry po 5 sekundžių kaip SuccessModal
    }, 5000);

    return () => clearTimeout(timeout);
  }, [onRetry]);

  return (
    <motion.div
      className={styles.overlay} // ✅ Tas pats overlay
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
    >
      <motion.div
        className={styles.modal} // ✅ Tas pats modal box kaip SuccessModal
        initial={{ scale: 0.8 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
      >
        <FaTimesCircle size={48} color="#ff4d4f" style={{ marginBottom: "16px" }} />
        <h2 className={styles.title}>Error</h2>
        <p className={styles.message}>{error}</p>

        <button className={styles.closeButton} onClick={onRetry}>
          Retry
        </button>
      </motion.div>
    </motion.div>
  );
}

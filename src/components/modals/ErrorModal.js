"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaTimesCircle } from "react-icons/fa";
import styles from "@/components/modals/errormodal.module.css";

export default function ErrorModal({ error, onClose }) {
  useEffect(() => {
    if (!error) return;
    const timer = setTimeout(() => {
      if (typeof onClose === "function") onClose();
    }, 5000);
    return () => clearTimeout(timer);
  }, [error, onClose]);

  return (
    <AnimatePresence>
      {error && (
        <motion.div
          className={styles.overlay}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="errorTitle"
          aria-describedby="errorMessage"
        >
          <motion.div
            className={styles.modal}
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.85, opacity: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 22 }}
          >
            <FaTimesCircle className={styles.icon} />

            <h2 id="errorTitle" className={styles.title}>
              Error
            </h2>

            <p id="errorMessage" className={styles.message}>
              {error || "An unexpected error occurred."}
            </p>

            <p className={styles.subtext}>This will close automatically.</p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

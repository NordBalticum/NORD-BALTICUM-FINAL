"use client";

import { motion } from "framer-motion";
import MiniLoadingSpinner from "@/components/MiniLoadingSpinner";
import styles from "@/components/miniloadingspinner.module.css";

export default function AppLoader() {
  return (
    <div className={styles.fullscreenOverlay}>
      <motion.div
        className={styles.spinnerWrapper}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.8 }}
        transition={{ duration: 0.6, ease: [0.25, 1, 0.5, 1] }}
        aria-live="assertive" // Important for accessibility: Ensures screen readers announce the loader
        role="status" // Ensures proper context for screen readers
      >
        <MiniLoadingSpinner size={48} color="#ffffff" />
      </motion.div>
      <div className={styles.loadingMessage}>
        <span>Loading...</span>
      </div>
    </div>
  );
}

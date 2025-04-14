// src/components/AppLoader.js
"use client";

import { motion } from "framer-motion";
import MiniLoadingSpinner from "@/components/MiniLoadingSpinner";
import styles from "@/components/miniloadingspinner.module.css"; // ✅ Naudojam jau esamą failą!

export default function AppLoader() {
  return (
    <div className={styles.fullscreenOverlay}>
      <motion.div
        className={styles.spinnerWrapper}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.8 }}
        transition={{ duration: 0.5, ease: [0.25, 1, 0.5, 1] }}
      >
        <MiniLoadingSpinner size={48} color="#ffffff" />
      </motion.div>
    </div>
  );
}

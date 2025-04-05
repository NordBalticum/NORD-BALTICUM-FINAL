"use client";

import { motion, AnimatePresence } from "framer-motion";
import styles from "@/components/successtoast.module.css"; // Naujas CSS failas

export default function SuccessToast({ show, message }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className={styles.toast}
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          transition={{ duration: 0.3 }}
        >
          {message}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

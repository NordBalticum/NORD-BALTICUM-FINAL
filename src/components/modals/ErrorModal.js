"use client";

import { motion } from "framer-motion";
import styles from "./modals.module.css";
import { FaTimesCircle } from "react-icons/fa";

export default function ErrorModal({ message = "Something went wrong.", onClose }) {
  return (
    <motion.div
      className={styles.overlay}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
    >
      <motion.div
        className={styles.modalBox}
        initial={{ scale: 0.8 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
      >
        <FaTimesCircle size={52} color="#ff4c4c" />
        <p className={styles.text}>{message}</p>
        <button className={styles.button} onClick={onClose}>
          Close
        </button>
      </motion.div>
    </motion.div>
  );
}

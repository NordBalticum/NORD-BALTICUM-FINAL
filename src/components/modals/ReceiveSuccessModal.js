"use client";

import { motion, AnimatePresence } from "framer-motion";
import { FaCheckCircle } from "react-icons/fa";
import styles from "@/components/modals/receivesuccessmodal.module.css";

export default function ReceiveSuccessModal({ show, onClose, amount, network }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className={styles.overlay}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          role="dialog"
          aria-modal="true"
        >
          <motion.div
            className={styles.modal}
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.85, opacity: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
          >
            <FaCheckCircle className={styles.icon} />

            <h2 className={styles.title}>Funds Received</h2>
            <p className={styles.amount}>+{amount} {network?.toUpperCase()}</p>

            <button className={styles.button} onClick={onClose}>
              Close
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

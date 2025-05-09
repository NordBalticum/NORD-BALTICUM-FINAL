"use client";

import { motion, AnimatePresence } from "framer-motion";
import styles from "./stepmodal.module.css";

export default function StepModal({ step, onNext, onPrev }) {
  const steps = [
    {
      title: "Step 1",
      content: "Enter recipient address and amount.",
    },
    {
      title: "Step 2",
      content: "Review your transaction details.",
    },
    {
      title: "Step 3",
      content: "Confirm the transaction.",
    },
  ];

  const current = steps[step - 1];

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={step}
        className={styles.overlay}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25 }}
      >
        <motion.div
          className={styles.stepModal}
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          exit={{ scale: 0.9 }}
          transition={{ type: "spring", stiffness: 240, damping: 18 }}
        >
          <h3 className={styles.modalTitle}>{current.title}</h3>
          <p className={styles.modalContent}>{current.content}</p>

          <div className={styles.modalActions}>
            {step > 1 && (
              <button className={styles.buttonGhost} onClick={onPrev}>
                Back
              </button>
            )}
            <button className={styles.buttonPrimary} onClick={onNext}>
              {step < 3 ? "Next" : "Finish"}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

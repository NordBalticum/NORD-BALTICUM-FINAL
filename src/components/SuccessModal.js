// components/SuccessModal.js
"use client";

import React, { useEffect } from "react";
import styles from "./avatar.module.css";

export default function SuccessModal({ message = "Avatar updated!", onClose }) {
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (onClose) onClose();
    }, 2000);
    return () => clearTimeout(timeout);
  }, [onClose]);

  return (
    <div className={styles.successBackdrop}>
      <div className={styles.successModal}>
        <span className={styles.successIcon}>✔</span>
        <p className={styles.successText}>{message}</p>
      </div>
    </div>
  );
}

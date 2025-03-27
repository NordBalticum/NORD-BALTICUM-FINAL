"use client";

import React from "react";
import styles from "./avatar.module.css";

export default function SuccessModal({ onClose }) {
  return (
    <div className={styles.successOverlay}>
      <div className={styles.successBox}>
        <p className={styles.successText}>Avatar Updated Successfully!</p>
        <button className={styles.successBtn} onClick={onClose}>OK</button>
      </div>
    </div>
  );
}

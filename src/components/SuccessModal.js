"use client";

import React from "react";
import styles from "./avatar.module.css";
import { FaCheckCircle } from "react-icons/fa";

export default function SuccessModal({ onClose }) {
  return (
    <div className={styles.successOverlay}>
      <div className={styles.successBox}>
        <FaCheckCircle size={48} color="#00cc99" style={{ marginBottom: 16 }} />
        <p className={styles.successText}>Avatar updated successfully!</p>
        <button className={styles.successBtn} onClick={onClose}>Got it</button>
      </div>
    </div>
  );
}

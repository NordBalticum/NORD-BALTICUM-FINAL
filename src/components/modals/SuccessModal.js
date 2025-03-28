"use client";

import React from "react";
import ModalPortal from "./ModalPortal";
import styles from "./modals.module.css";
import { FaCheckCircle } from "react-icons/fa";

export default function SuccessModal({ message = "Success!", onClose }) {
  return (
    <ModalPortal>
      <div className={styles.overlay}>
        <div className={styles.modalBox}>
          <FaCheckCircle size={52} color="#00cc99" />
          <p className={styles.text}>{message}</p>
          <button className={styles.button} onClick={onClose}>Got it</button>
        </div>
      </div>
    </ModalPortal>
  );
}

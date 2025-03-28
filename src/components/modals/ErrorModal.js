"use client";

import React from "react";
import ModalPortal from "./ModalPortal";
import styles from "./modals.module.css";
import { FaTimesCircle } from "react-icons/fa";

export default function ErrorModal({ message = "Something went wrong.", onClose }) {
  return (
    <ModalPortal>
      <div className={styles.overlay}>
        <div className={styles.modalBox}>
          <FaTimesCircle size={52} color="#ff4c4c" />
          <p className={styles.text}>{message}</p>
          <button className={styles.button} onClick={onClose}>Close</button>
        </div>
      </div>
    </ModalPortal>
  );
}

"use client";

import styles from "./miniloadingspinner.module.css"; // Import CSS module

export default function MiniLoadingSpinner({ size = 30, color = "#3498db", borderColor = "#f3f3f3" }) {
  return (
    <div className={styles.fullscreenOverlay}>
      <div className={styles.spinnerWrapper}>
        <div
          className={styles.spinner}
          style={{
            width: size,
            height: size,
            border: `3px solid ${borderColor}`,
            borderTop: `3px solid ${color}`,
          }}
        ></div>
        <div className={styles.loadingMessage}>Loading...</div>
      </div>
    </div>
  );
}

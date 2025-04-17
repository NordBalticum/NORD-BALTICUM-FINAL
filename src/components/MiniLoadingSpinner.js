"use client";

import styles from "./miniloadingspinner.module.css"; // Import CSS module

export default function MiniLoadingSpinner({ size = 20 }) {
  return (
    <div className={styles.spinnerWrapper}>
      <div
        className={styles.spinner}
        style={{
          width: size,
          height: size,
          border: "3px solid #f3f3f3",
          borderTop: "3px solid #3498db",
        }}
      ></div>
    </div>
  );
}

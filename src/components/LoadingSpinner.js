"use client";

import { motion } from "framer-motion";

export default function LoadingSpinner() {
  return (
    <div style={styles.container}>
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
        style={styles.spinner}
      />
      <div style={styles.text}>Loading...</div>
    </div>
  );
}

const styles = {
  container: {
    height: "100vh",
    width: "100vw",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    background: "radial-gradient(ellipse at center, #0a122a 15%, #1b2370 65%, #2b37ff 100%)",
  },
  spinner: {
    width: "60px",
    height: "60px",
    border: "8px solid rgba(255, 255, 255, 0.1)",
    borderTop: "8px solid #ffd700",
    borderRadius: "50%",
    marginBottom: "20px",
  },
  text: {
    color: "#fff",
    fontFamily: "var(--font-crypto)",
    fontSize: "1.2rem",
    opacity: 0.8,
    letterSpacing: "1px",
  },
};

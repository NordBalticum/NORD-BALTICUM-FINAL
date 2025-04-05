"use client";

import { motion } from "framer-motion";

export default function LoadingSpinner() {
  return (
    <div style={styles.container}>
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 1.2, ease: "linear" }}
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
    backdropFilter: "blur(8px)",  // ✅ Soft blur visam fonui
    background: "radial-gradient(ellipse at center, rgba(10,18,42,0.8) 10%, rgba(27,35,112,0.85) 60%, rgba(43,55,255,0.9) 100%)",
  },
  spinner: {
    width: "70px",
    height: "70px",
    border: "8px solid rgba(255, 255, 255, 0.2)",     // ✅ Labai švelnus baltas fonas
    borderTop: "8px solid #ffffff",                   // ✅ Tik viršutinė dalis balta
    borderRadius: "50%",
    boxShadow: "0 0 15px rgba(255, 255, 255, 0.6)",    // ✅ Soft Glow aplink
    marginBottom: "20px",
  },
  text: {
    color: "#ffffff",
    fontFamily: "var(--font-crypto)",
    fontSize: "1.4rem",
    fontWeight: "600",
    opacity: 0.85,
    letterSpacing: "1px",
    textShadow: "0 0 8px rgba(255, 255, 255, 0.5)",   // ✅ Tekstas irgi su Soft Glow
  },
};

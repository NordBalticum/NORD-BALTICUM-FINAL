"use client";

import { motion } from "framer-motion";

export default function MiniLoadingSpinner() {
  return (
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }}
      style={styles.spinner}
    />
  );
}

const styles = {
  spinner: {
    width: "20px",                   // ✅ Mažas premium dydis
    height: "20px",
    border: "3px solid rgba(255, 255, 255, 0.2)",  // ✅ Švelnus balto tono background
    borderTop: "3px solid #ffffff",               // ✅ Tik viršus baltas, premium clean
    borderRadius: "50%",
    boxShadow: "0 0 6px rgba(255, 255, 255, 0.5)", // ✅ Soft Glow efektas
    marginLeft: "8px",                            // ✅ Tarpu paliekam šalia teksto
  },
};

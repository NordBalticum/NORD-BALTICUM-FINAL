"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

export default function MiniLoadingSpinner() {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsClient(true);
    }
  }, []);

  if (!isClient) {
    return null;
  }

  return (
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ repeat: Infinity, duration: 1.2, ease: "easeInOut" }} // ✅ Smoother rotation
      style={styles.spinner}
    />
  );
}

const styles = {
  spinner: {
    width: "32px",                       // ✅ Didesnis, elegantiškesnis
    height: "32px",
    border: "4px solid rgba(255, 255, 255, 0.15)", // ✅ Premium švelnus apvadas
    borderTop: "4px solid #ffffff",       // ✅ Balta viršūnė
    borderRadius: "50%",
    boxShadow: "0 0 12px rgba(255, 255, 255, 0.4)", // ✅ Glow efektas aplink
    marginLeft: "8px",
    background: "transparent",
  },
};

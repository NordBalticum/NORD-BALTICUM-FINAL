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
    return null; // ✅ Jei dar serveris – nieko nerodome
  }

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
    width: "20px",
    height: "20px",
    border: "3px solid rgba(255, 255, 255, 0.2)",
    borderTop: "3px solid #ffffff",
    borderRadius: "50%",
    boxShadow: "0 0 6px rgba(255, 255, 255, 0.5)",
    marginLeft: "8px",
  },
};

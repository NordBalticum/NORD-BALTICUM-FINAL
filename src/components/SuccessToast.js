"use client";

import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import styles from "@/components/successtoast.module.css";

const networkLogos = {
  eth: "/icons/eth.svg",
  bnb: "/icons/bnb.svg",
  tbnb: "/icons/bnb.svg",      // Testnet same logo
  matic: "/icons/matic.svg",
  avax: "/icons/avax.svg",
};

export default function SuccessToast({ show, message = "", networkKey = "" }) {
  const key = networkKey?.toLowerCase?.() || "";
  const logoSrc = networkLogos[key] || null;

  return (
    <AnimatePresence mode="wait">
      {show && (
        <motion.div
          className={styles.toast}
          initial={{ opacity: 0, y: -28, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{
            duration: 0.4,
            ease: [0.25, 1, 0.5, 1],
          }}
          role="status"
          aria-live="polite"
        >
          {logoSrc && (
            <div className={styles.logoWrapper} aria-hidden="true">
              <Image
                src={logoSrc}
                alt={`${key.toUpperCase()} Logo`}
                width={28}
                height={28}
                unoptimized
                priority
              />
            </div>
          )}
          <div className={styles.message}>{message}</div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

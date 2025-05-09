"use client";

import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import styles from "@/components/successtoast.module.css";

const networkLogos = {
  eth: "/icons/eth.svg",
  bnb: "/icons/bnb.svg",
  tbnb: "/icons/bnb.svg",
  matic: "/icons/matic.svg",
  avax: "/icons/avax.svg",
};

export default function SuccessToast({ show, message = "", networkKey = "" }) {
  const key = networkKey?.toLowerCase();
  const logoSrc = networkLogos[key] || null;
  const dynamicClass = key && styles[key] ? styles[key] : "";

  return (
    <AnimatePresence mode="wait">
      {show && (
        <motion.div
          className={`${styles.toast} ${dynamicClass}`}
          initial={{ opacity: 0, y: -30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{
            duration: 0.45,
            ease: [0.25, 1, 0.5, 1],
          }}
        >
          {logoSrc && (
            <div className={styles.logoWrapper}>
              <Image
                src={logoSrc}
                alt={`${key.toUpperCase()} Logo`}
                width={28}
                height={28}
                unoptimized
              />
            </div>
          )}
          <div className={styles.message}>{message}</div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

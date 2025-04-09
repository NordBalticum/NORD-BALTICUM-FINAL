"use client";

import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import styles from "@/styles/SuccessToast.module.css"; // ✅ pritaikytas prie naujo

// ✅ Tinklų logotipai
const networkLogos = {
  eth: "https://cryptologos.cc/logos/ethereum-eth-logo.png",
  bnb: "https://cryptologos.cc/logos/binance-coin-bnb-logo.png",
  tbnb: "https://cryptologos.cc/logos/binance-coin-bnb-logo.png",
  matic: "https://cryptologos.cc/logos/polygon-matic-logo.png",
  avax: "https://cryptologos.cc/logos/avalanche-avax-logo.png",
};

export default function SuccessToast({ show, message = "", networkKey = "" }) {
  const logoSrc = networkLogos[networkKey?.toLowerCase()] || null;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className={styles.toast}
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 50 }}
          transition={{ duration: 0.5 }}
        >
          {logoSrc && (
            <div className={styles.logoWrapper}>
              <Image src={logoSrc} alt="Network Logo" width={28} height={28} unoptimized />
            </div>
          )}
          <div className={styles.message}>{message}</div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

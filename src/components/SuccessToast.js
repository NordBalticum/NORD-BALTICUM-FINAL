"use client";

import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import styles from "@/components/successtoast.module.css"; // ✅ Premium CSS

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
    <AnimatePresence mode="wait">
      {show && (
        <motion.div
          className={styles.toast}
          initial={{ opacity: 0, y: -30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{
            duration: 0.45,
            ease: [0.25, 1, 0.5, 1], // ✅ Šilkinė kreivė
          }}
        >
          {logoSrc && (
            <div className={styles.logoWrapper}>
              <Image
                src={logoSrc}
                alt={`${networkKey.toUpperCase()} Logo`}
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

"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import QRCode from "react-qr-code";
import { motion } from "framer-motion";

import styles from "./receivecomponent.module.css"; // ✅ atskiras premium CSS

export default function ReceiveComponent() {
  const { wallet, activeNetwork, loading } = useAuth();
  const [copied, setCopied] = useState(false);
  const [isReady, setIsReady] = useState(false);

  const address = wallet?.wallet?.address || "";

  useEffect(() => {
    if (!loading && address) {
      setIsReady(true); // ✅ Kai yra address ir nebeloadina, tik tada rodom QR
    }
  }, [loading, address]);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Copy failed:", error.message);
    }
  };

  if (!isReady) {
    return <div className={styles.loading}>Loading Wallet Address...</div>;
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className={styles.container}
    >
      <h2 className={styles.title}>
        RECEIVE {activeNetwork?.toUpperCase()}
      </h2>

      <div className={styles.qrWrapper} onClick={copyToClipboard} title="Click to copy address">
        <QRCode 
          value={address}
          size={180}
          bgColor="transparent"
          fgColor="#ffffff"
          style={{ width: "100%", height: "auto" }}
        />
      </div>

      <p className={styles.address}>
        {address}
      </p>

      <button
        onClick={copyToClipboard}
        className={`${styles.button} ${copied ? styles.copied : ""}`}
      >
        {copied ? "Copied!" : "Copy Address"}
      </button>
    </motion.div>
  );
}

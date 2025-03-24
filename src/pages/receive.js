"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useMagicLink } from "@/contexts/MagicLinkContext";
import { useBalance } from "@/contexts/BalanceContext";
import QRCode from "react-qr-code";
import styles from "@/styles/receive.module.css";
import BottomNavigation from "@/components/BottomNavigation";

export default function ReceivePage() {
  const router = useRouter();
  const { user, wallet } = useMagicLink();
  const { selectedNetwork, balances } = useBalance();
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!user || !wallet) {
      router.push("/");
    }
  }, [user, wallet]);

  const handleCopy = () => {
    if (!wallet?.address) return;
    navigator.clipboard.writeText(wallet.address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!user || !wallet) return null;

  return (
    <div className="globalContainer">
      <div className={styles.wrapper}>
        <h1 className={styles.title}>Receive</h1>

        <div className={styles.card}>
          <div className={styles.qrBox} onClick={handleCopy}>
            <QRCode
              value={wallet.address}
              size={180}
              bgColor="#ffffff"
              fgColor="#0A122A"
              className={styles.qrCode}
            />
          </div>

          <p className={styles.address} onClick={handleCopy}>
            {wallet.address}
          </p>
          <p className={styles.copyFeedback}>
            {copied ? "✔ Copied!" : "Click QR or address to copy"}
          </p>

          <div className={styles.infoRow}>
            <span className={styles.label}>Network:</span>
            <span className={styles.value}>{selectedNetwork}</span>
          </div>

          <div className={styles.infoRow}>
            <span className={styles.label}>Balance:</span>
            <span className={styles.value}>
              {balances[selectedNetwork]?.amount || "0.0000"}{" "}
              {selectedNetwork?.toUpperCase()}
            </span>
          </div>
        </div>
      </div>
      <BottomNavigation />
    </div>
  );
}

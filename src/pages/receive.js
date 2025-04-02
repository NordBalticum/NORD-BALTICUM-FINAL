"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import QRCode from "react-qr-code";
import { useMagicLink } from "@/contexts/MagicLinkContext";
import styles from "@/styles/receive.module.css";
import background from "@/styles/background.module.css";

export default function Receive() {
  const router = useRouter();
  const { user, fetchUserWallet } = useMagicLink();
  const [publicKey, setPublicKey] = useState(null);
  const [totalEUR, setTotalEUR] = useState("0.00");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (user) {
      fetchUserWallet(user.email)
        .then((wallet) => {
          setPublicKey(wallet.address);
          setTotalEUR(wallet.totalEUR);
        })
        .catch((err) => console.error("Error fetching wallet:", err));
    } else {
      router.replace("/");
    }
  }, [user, fetchUserWallet, router]);

  const handleCopy = () => {
    if (!publicKey) return;
    navigator.clipboard.writeText(publicKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!user || !publicKey) {
    return <div className={styles.loading}>Loading Wallet...</div>;
  }

  return (
    <main className={`${styles.main} ${background.gradient}`}>
      <div className={styles.globalContainer}>
        <div className={styles.wrapper}>
          <h1 className={styles.title}>RECEIVE</h1>
          <p className={styles.subtext}>Your MultiNetwork Receiving Address</p>

          <div className={styles.qrContainer} onClick={handleCopy}>
            <QRCode
              value={publicKey}
              size={180}
              bgColor="transparent"
              fgColor="#ffffff"
            />
          </div>

          <div className={styles.infoBoxes}>
            <div className={styles.infoBox}>
              <div className={styles.label}>Total Balance (All Networks)</div>
              <div className={styles.value}>€ {totalEUR}</div>
            </div>

            <div className={styles.infoBox} onClick={handleCopy}>
              <div className={styles.value}>{publicKey}</div>
            </div>
          </div>

          {copied && <div className={styles.copied}>Wallet Address Copied</div>}
        </div>
      </div>
    </main>
  );
          }

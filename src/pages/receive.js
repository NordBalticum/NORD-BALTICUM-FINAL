"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { useMagicLink } from "@/contexts/MagicLinkContext";
import { useWallet } from "@/contexts/WalletContext";
import { useBalance } from "@/contexts/BalanceContext";

import QRCode from "react-qr-code";
import StarsBackground from "@/components/StarsBackground";

import styles from "@/styles/receive.module.css";
import background from "@/styles/background.module.css";

export default function Receive() {
  const router = useRouter();
  const { user } = useMagicLink();
  const { wallet } = useWallet();
  const { balances } = useBalance();

  const [copied, setCopied] = useState(false);

  const ethWallet = wallet?.list?.find((w) => w.network.toLowerCase() === "eth");
  const defaultWallet = wallet?.list?.[0];
  const address = ethWallet?.address || defaultWallet?.address || wallet?.address || "";

  useEffect(() => {
    if (!user || !address) {
      router.push("/");
    }
  }, [user, address]);

  const handleCopy = () => {
    if (!address) return;
    try {
      navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error("❌ Copy failed:", e.message);
    }
  };

  if (!user || !address) {
    return <div className={styles.loading}>Loading Wallet...</div>;
  }

  return (
    <main className={`${styles.main} ${background.gradient}`}>
      <StarsBackground />

      <div className={styles.globalContainer}>
        <div className={styles.wrapper}>
          <h1 className={styles.title}>RECEIVE</h1>
          <p className={styles.subtext}>Your MultiNetwork Receiving Address</p>

          <div className={styles.qrContainer} onClick={handleCopy}>
            <QRCode
              value={address}
              size={180}
              bgColor="transparent"
              fgColor="#ffffff"
            />
          </div>

          <div className={styles.infoBoxes}>
            <div className={styles.infoBox}>
              <div className={styles.label}>Total Balance (All Networks)</div>
              <div className={styles.value}>€ {balances?.totalEUR || "0.00"}</div>
            </div>

            <div className={styles.infoBox} onClick={handleCopy}>
              <div className={styles.value}>{address}</div>
            </div>
          </div>

          {copied && <div className={styles.copied}>Wallet Address Copied</div>}
        </div>
      </div>
    </main>
  );
          }

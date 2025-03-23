"use client";

import { useRouter } from "next/router";
import { useMagicLink } from "@/contexts/MagicLinkContext";
import { useBalance } from "@/contexts/BalanceContext";
import QRCode from "react-qr-code";
import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import styles from "@/styles/receive.module.css";

export default function ReceivePage() {
  const router = useRouter();
  const { user, wallet } = useMagicLink();
  const { balance, selectedNetwork } = useBalance();
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!user || !wallet) {
      router.push("/");
    }
  }, [user, wallet, router]);

  const handleCopy = () => {
    if (!wallet?.address) return;
    navigator.clipboard.writeText(wallet.address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!user || !wallet) return null;

  return (
    <div className="fullscreenContainer" role="main" aria-label="Receive Page">
      <Navbar />

      <div className={styles.wrapper}>
        <h1 className={styles.title}>Receive BNB</h1>

        <div className={styles.qrBox}>
          <QRCode value={wallet.address} size={180} bgColor="#ffffff" fgColor="#0A122A" />
        </div>

        <p className={styles.addressLabel}>Your wallet address:</p>
        <p className={styles.address} aria-label="Your wallet address">{wallet.address}</p>

        <button className={styles.copyButton} onClick={handleCopy} aria-label="Copy address">
          {copied ? "✔ Copied!" : "Copy Address"}
        </button>

        <div className={styles.networkInfo}>
          <p>Network: <strong>{selectedNetwork === "bsc" ? "BSC Mainnet" : "BSC Testnet"}</strong></p>
          <p>Balance: <strong>{balance} BNB</strong></p>
        </div>
      </div>
    </div>
  );
}

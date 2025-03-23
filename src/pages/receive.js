"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { useMagicLink } from "@/contexts/MagicLinkContext";
import { useBalance } from "@/contexts/BalanceProviderEthers";
import QRCode from "react-qr-code";
import Navbar from "@/components/Navbar";
import styles from "@/styles/receive.module.css";

export default function ReceivePage() {
  const router = useRouter();
  const { user, wallet } = useMagicLink();
  const {
    balance,
    selectedNetwork,
    setSelectedNetwork,
    refreshBalance,
  } = useBalance();

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
    <div className="fullscreenContainer">
      <Navbar />

      <div className={styles.receiveWrapper}>
        <h1 className={styles.title}>Receive BNB</h1>

        <div className={`${styles.qrContainer} ${copied ? styles.copied : ""}`} onClick={handleCopy}>
          <QRCode
            value={wallet.address}
            size={200}
            bgColor="#ffffff"
            fgColor="#0A122A"
            className={styles.qrCode}
          />
        </div>

        <p className={styles.qrText}>{wallet.address}</p>
        <p className={`${styles.copyFeedback} ${copied ? styles.copied : ""}`}>
          {copied ? "✔ Copied!" : "Click QR or address to copy"}
        </p>

        <div className={styles.networkInfo}>
          <label className={styles.label}>Network:</label>
          <select
            className={styles.select}
            value={selectedNetwork}
            onChange={(e) => setSelectedNetwork(e.target.value)}
          >
            <option value="bsc">BSC Mainnet</option>
            <option value="bscTestnet">BSC Testnet</option>
          </select>
        </div>

        <p className={styles.balanceText}>
          Balance: <strong>{balance} BNB</strong>
        </p>

        <button className={styles.copyButton} onClick={refreshBalance}>
          🔄 Refresh Balance
        </button>
      </div>
    </div>
  );
}

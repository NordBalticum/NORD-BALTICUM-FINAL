"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import QRCode from "react-qr-code";

import { useMagicLink } from "@/contexts/MagicLinkContext";
import { useWallet } from "@/contexts/WalletContext";
import { fetchPrices } from "@/utils/fetchPrices";
import { getWalletBalance } from "@/lib/ethers";

import StarsBackground from "@/components/StarsBackground";
import styles from "@/styles/receive.module.css";
import background from "@/styles/background.module.css";

export default function Receive() {
  const router = useRouter();
  const { user } = useMagicLink();
  const { publicKey } = useWallet();

  const [copied, setCopied] = useState(false);
  const [totalEUR, setTotalEUR] = useState("0.00");

  useEffect(() => {
    if (!user || !publicKey) {
      router.push("/");
      return;
    }

    const loadBalances = async () => {
      try {
        const prices = await fetchPrices();
        let total = 0;

        const networks = ["bnb", "tbnb", "eth", "matic", "avax"];
        for (const net of networks) {
          const { formatted } = await getWalletBalance(publicKey, net);
          const price = prices[net.toUpperCase()] || 0;
          total += parseFloat(formatted) * price;
        }

        setTotalEUR(total.toFixed(2));
      } catch (err) {
        console.error("❌ Failed to load balances:", err.message);
        setTotalEUR("0.00");
      }
    };

    loadBalances();
  }, [user, publicKey]);

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
      <StarsBackground />

      <div className={styles.globalContainer}>
        <div className={styles.wrapper}>
          <h1 className={styles.title}>RECEIVE</h1>
          <p className={styles.subtext}>Your MultiNetwork Receiving Address</p>

          <div className={styles.qrContainer} onClick={handleCopy}>
            <QRCode value={publicKey} size={180} bgColor="transparent" fgColor="#ffffff" />
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

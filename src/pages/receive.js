"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useMagicLink } from "@/contexts/MagicLinkContext";
import { useWallet } from "@/contexts/WalletContext";
import { getWalletBalance } from "@/lib/ethers";
import QRCode from "react-qr-code";
import StarsBackground from "@/components/StarsBackground";
import styles from "@/styles/receive.module.css";

export default function Receive() {
  const router = useRouter();
  const { user } = useMagicLink();
  const { wallet } = useWallet();

  const [balanceEUR, setBalanceEUR] = useState("0.00");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!user || !wallet?.address) router.push("/");
  }, [user, wallet]);

  useEffect(() => {
    if (wallet?.address && wallet?.addresses?.eth) {
      getWalletBalance(wallet.address, "eth").then((res) => {
        const fakeEur = parseFloat(res.formatted || "0") * 2400;
        setBalanceEUR(fakeEur.toFixed(2));
      });
    }
  }, [wallet]);

  const address = wallet?.addresses?.eth;

  const handleCopy = () => {
    if (address) {
      navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!user || !wallet?.address) {
    return <div className={styles.loading}>Loading Wallet...</div>;
  }

  return (
    <main className={styles.main}>
      <StarsBackground />

      <div className={styles.globalContainer}>
        <div className={styles.wrapper}>
          <h1 className={styles.title}>RECEIVE</h1>
          <p className={styles.subtext}>Your MultiNetwork Receiving Address</p>

          <div className={styles.qrContainer} onClick={handleCopy}>
            <QRCode
              value={address || ""}
              size={180}
              bgColor="transparent"
              fgColor="#ffffff"
            />
            {copied && <div className={styles.copied}>Wallet Address Copied</div>}
          </div>

          <div className={styles.infoBoxes}>
            <div className={styles.infoBox}>
              <div className={styles.label}>Total Balance (all networks based)</div>
              <div className={styles.value}>€ {balanceEUR}</div>
            </div>

            <div className={styles.infoBox} onClick={handleCopy}>
              <div className={styles.value}>{address}</div>
              {copied && <div className={styles.copied}>Wallet Address Copied</div>}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
              }

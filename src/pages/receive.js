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

  const copyAddress = () => {
    if (address) navigator.clipboard.writeText(address);
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
          <p className={styles.subtext}>Your Ethereum receiving address</p>

          <div className={styles.qrContainer} onClick={copyAddress}>
            <QRCode
              value={address || ""}
              size={180}
              bgColor="transparent"
              fgColor="#ffffff"
            />
          </div>

          <div className={styles.infoBoxes}>
            <div className={styles.infoBox}>
              <div className={styles.label}>Total Balance (all networks based)</div>
              <div className={styles.value}>€ {balanceEUR}</div>
            </div>

            <div className={styles.infoBox} onClick={copyAddress}>
              <div className={styles.label}>Wallet Address</div>
              <div className={styles.value}>{address}</div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

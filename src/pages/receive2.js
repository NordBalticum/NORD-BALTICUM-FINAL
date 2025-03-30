"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useMagicLink } from "@/contexts/MagicLinkContext";
import { useWallet } from "@/contexts/WalletContext";
import QRCode from "react-qr-code";

import SwipeSelector from "@/components/SwipeSelector";
import styles from "@/styles/receive2.module.css";

export default function Receive2() {
  const router = useRouter();
  const { user } = useMagicLink();
  const { wallet } = useWallet();
  const [selected, setSelected] = useState(0);

  useEffect(() => {
    if (!user || !wallet?.address) router.push("/");
  }, [user, wallet]);

  if (!user || !wallet?.address) {
    return <div className={styles.loading}>Loading Wallet...</div>;
  }

  const supportedNetworks = [
    { name: "BNB Chain", symbol: "bnb", key: "bsc" },
    { name: "BNB Testnet", symbol: "tbnb", key: "bsctest" },
    { name: "Ethereum", symbol: "eth", key: "eth" },
    { name: "Polygon", symbol: "pol", key: "polygon" },
    { name: "Avalanche", symbol: "avax", key: "avax" },
  ];

  const selectedNet = supportedNetworks[selected];
  const address = wallet.addresses?.[selectedNet.key];

  const copyAddress = () => {
    if (address) navigator.clipboard.writeText(address);
  };

  return (
    <main className={styles.main}>
      <div className={styles.globalContainer}>
        <div className={styles.wrapper}>
          <h1 className={styles.title}>RECEIVE</h1>
          <p className={styles.subtext}>
            Choose your network to get your address
          </p>

          <SwipeSelector
            mode="receive"
            onSelect={(symbol) => {
              const index = supportedNetworks.findIndex(
                (n) => n.symbol.toLowerCase() === symbol.toLowerCase()
              );
              if (index !== -1) setSelected(index);
            }}
          />

          <div className={styles.qrContainer}>
            <QRCode
              value={address || ""}
              size={180}
              bgColor="transparent"
              fgColor="#ffffff"
            />
            <div className={styles.address}>{address}</div>
            <button className={styles.copyButton} onClick={copyAddress}>
              COPY ADDRESS
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}

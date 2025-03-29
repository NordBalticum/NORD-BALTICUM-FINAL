"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import QRCode from "react-qr-code";

import { useMagicLink } from "@/contexts/MagicLinkContext";
import { useWallet } from "@/contexts/WalletContext";

import SwipeSelector from "@/components/SwipeSelector";
import SuccessModal from "@/components/modals/SuccessModal";

import { supportedNetworks } from "@/utils/networks";
import styles from "@/styles/receive.module.css";

export default function Receive() {
  const router = useRouter();
  const { user } = useMagicLink();
  const { wallet } = useWallet();

  const [selected, setSelected] = useState(0);
  const [showSuccess, setShowSuccess] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!user || !wallet?.address) router.push("/");
  }, [user, wallet]);

  const handleCopy = () => {
    if (!wallet?.address) return;
    navigator.clipboard.writeText(wallet.address);
    setCopied(true);
    setShowSuccess(true);
    setTimeout(() => {
      setCopied(false);
    }, 1000);
  };

  if (!user || !wallet?.address) {
    return <div className={styles.loading}>Loading Wallet...</div>;
  }

  const selectedNetwork = supportedNetworks[selected];

  return (
    <div className="globalContainer">
      <div className={styles.wrapper}>
        <h1 className={styles.title}>RECEIVE CRYPTO</h1>
        <p className={styles.subtext}>Choose your network and receive funds</p>

        <SwipeSelector
          mode="receive"
          onSelect={(symbol) => {
            const index = supportedNetworks.findIndex(
              (n) => n.symbol.toLowerCase() === symbol.toLowerCase()
            );
            if (index !== -1) setSelected(index);
          }}
        />

        <div className={styles.walletActions}>
          <div onClick={handleCopy} style={{ cursor: "pointer" }}>
            <QRCode
              value={wallet.address}
              size={180}
              bgColor="transparent"
              fgColor="#ffffff"
              style={{
                margin: "0 auto",
                borderRadius: "16px",
                padding: "12px",
                background: "rgba(255,255,255,0.04)",
                boxShadow: "0 0 24px rgba(255,255,255,0.2)",
                backdropFilter: "blur(12px)",
              }}
            />
          </div>

          <div
            className={styles.inputField}
            style={{ textAlign: "center", cursor: "pointer" }}
            onClick={handleCopy}
          >
            {copied ? "Copied!" : wallet.address}
          </div>

          <p className={styles.subtext} style={{ marginTop: "12px" }}>
            Click QR or address to copy
          </p>
        </div>
      </div>

      {showSuccess && (
        <SuccessModal
          message="Wallet address copied!"
          onClose={() => setShowSuccess(false)}
        />
      )}
    </div>
  );
}

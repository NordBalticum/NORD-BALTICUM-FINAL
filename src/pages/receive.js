"use client";

import { useMagicLink } from "@/contexts/MagicLinkContext";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { JsonRpcProvider, formatEther } from "ethers";
import QRCode from "react-qr-code";
import styles from "@/styles/receive.module.css";

export default function Receive() {
  const { user, wallet } = useMagicLink();
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [balance, setBalance] = useState(null);
  const [network, setNetwork] = useState("bsc");

  const rpcUrls = {
    bsc: process.env.NEXT_PUBLIC_BSC_RPC,
    bscTestnet: process.env.NEXT_PUBLIC_BSC_TESTNET_RPC,
  };

  useEffect(() => {
    if (!user || !wallet) {
      const t = setTimeout(() => router.push("/"), 1200);
      return () => clearTimeout(t);
    }
  }, [user, wallet]);

  useEffect(() => {
    if (wallet && rpcUrls[network]) {
      const provider = new JsonRpcProvider(rpcUrls[network]);
      provider.getBalance(wallet.address).then((bal) => {
        setBalance(formatEther(bal));
      });
    }
  }, [wallet, network]);

  const handleCopy = async () => {
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(wallet.address);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = wallet.address;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Copy failed:", err);
    }
  };

  if (!user || !wallet) return null;

  return (
    <div className="globalContainer">
      <div
        className={`contentWrapper glassBox fadeIn ${styles.receiveWrapper}`}
        role="main"
        aria-label="Receive crypto interface"
      >
        <h2 className={styles.title}>Receive Crypto</h2>
        <p>Email: <strong>{user.email}</strong></p>
        <p style={{ marginTop: "0.8rem" }}>Wallet address:</p>

        <div
          onClick={handleCopy}
          className={`${styles.qrContainer} ${copied ? styles.copied : ""}`}
          aria-label="Tap QR to copy address"
        >
          <QRCode
            value={wallet.address}
            size={180}
            bgColor="#ffffff"
            fgColor="#000000"
            style={{ borderRadius: "12px", margin: "0 auto" }}
          />
          <p className={styles.qrText}>{wallet.address}</p>
          <small className={`${styles.copyFeedback} ${copied ? styles.copied : ""}`}>
            {copied ? "✓ Copied to clipboard!" : "Tap QR to copy address"}
          </small>
        </div>

        <div className={styles.networkSelector}>
          <label htmlFor="network" className={styles.networkLabel}>Network:</label>
          <select
            id="network"
            value={network}
            onChange={(e) => setNetwork(e.target.value)}
            className={styles.networkSelect}
            aria-label="Select blockchain network"
          >
            <option value="bsc">BSC Mainnet</option>
            <option value="bscTestnet">BSC Testnet</option>
          </select>
        </div>

        <h3 className={styles.balanceText}>
          Balance: {balance !== null ? `${balance} BNB` : "Loading..."}
        </h3>
      </div>
    </div>
  );
}

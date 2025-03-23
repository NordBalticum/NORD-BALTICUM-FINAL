"use client";

import { useEffect, useState, useCallback } from "react";
import { formatEther, JsonRpcProvider } from "ethers";
import { useMagicLink } from "@/contexts/MagicLinkContext";
import Navbar from "@/components/Navbar";
import styles from "@/styles/dashboard.module.css";

export default function TestBalance() {
  const { user, wallet } = useMagicLink();

  const [balance, setBalance] = useState("0.0000");
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  const provider = new JsonRpcProvider("https://bsc-testnet.publicnode.com");

  const fetchBalance = useCallback(async () => {
    if (!wallet?.address) return;

    setLoading(true);
    try {
      const raw = await provider.getBalance(wallet.address);
      setBalance(parseFloat(formatEther(raw)).toFixed(4));
    } catch (error) {
      console.error("❌ Balance fetch failed:", error);
      setBalance("0.0000");
    } finally {
      setLoading(false);
    }
  }, [wallet?.address]);

  const handleCopy = () => {
    if (!wallet?.address) return;
    navigator.clipboard.writeText(wallet.address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  useEffect(() => {
    fetchBalance();
  }, [fetchBalance]);

  if (!user || !wallet) {
    return (
      <div className={styles.loading}>
        Loading wallet...
      </div>
    );
  }

  return (
    <div className="fullscreenContainer">
      <Navbar />
      <div className={styles.wrapper}>
        <h1 className={styles.welcome}>Testnet Wallet</h1>

        <div className={styles.card}>
          <p className={styles.label}>Wallet address:</p>
          <p className={styles.address}>{wallet.address}</p>

          <button
            className={styles.actionButton}
            onClick={handleCopy}
          >
            {copied ? "✔ Copied!" : "Copy Address"}
          </button>

          <div className={styles.balanceBox}>
            <span className={styles.balanceLabel}>Balance:</span>
            <span className={styles.balanceValue}>
              {loading ? "Loading..." : `${balance} BNB`}
            </span>
          </div>

          <button
            className={styles.actionButton}
            onClick={fetchBalance}
          >
            🔄 Refresh Balance
          </button>
        </div>
      </div>
    </div>
  );
}

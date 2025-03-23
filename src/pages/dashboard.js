"use client";

import { useEffect } from "react";
import { useRouter } from "next/router";
import { useMagicLink } from "@/contexts/MagicLinkContext";
import { useBalance } from "@/contexts/BalanceProviderEthers";
import Navbar from "@/components/Navbar";
import styles from "@/styles/dashboard.module.css";

export default function Dashboard() {
  const router = useRouter();
  const { user, wallet } = useMagicLink();
  const {
    balance,
    loading,
    selectedNetwork,
    setSelectedNetwork,
  } = useBalance();

  useEffect(() => {
    if (!user || !wallet) {
      const timeout = setTimeout(() => router.push("/"), 1000);
      return () => clearTimeout(timeout);
    }
  }, [user, wallet, router]);

  if (!user || !wallet) {
    return (
      <div className={styles.loading} role="status">
        Loading your dashboard...
      </div>
    );
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(wallet.address);
  };

  return (
    <div className="fullscreenContainer" role="main">
      <Navbar />
      <div className={styles.wrapper}>
        <h1 className={styles.welcome}>
          Welcome,<br />
          <span className={styles.email}>{user.email}</span>
        </h1>

        <section className={styles.card} aria-labelledby="wallet-info">
          <label className={styles.label}>Your Wallet Address</label>
          <div className={styles.addressBox} onClick={handleCopy} title="Click to copy">
            <p className={styles.address}>{wallet.address}</p>
          </div>

          <div className={styles.networkSelector}>
            <label className={styles.label}>Select Network</label>
            <select
              className={styles.select}
              value={selectedNetwork}
              onChange={(e) => setSelectedNetwork(e.target.value)}
            >
              <option value="bsc">BSC Mainnet</option>
              <option value="bscTestnet">BSC Testnet</option>
            </select>
          </div>

          <div className={styles.balanceBox}>
            <span className={styles.balanceLabel}>Your Balance:</span>
            <span className={styles.balanceValue}>
              {balance} BNB
            </span>
          </div>
        </section>

        <div className={styles.actions}>
          <button
            className={styles.actionButton}
            onClick={() => router.push("/send")}
            aria-label="Send BNB"
          >
            🧾 SEND
          </button>
          <button
            className={styles.actionButton}
            onClick={() => router.push("/receive")}
            aria-label="Receive BNB"
          >
            ✅ RECEIVE
          </button>
        </div>
      </div>
    </div>
  );
}

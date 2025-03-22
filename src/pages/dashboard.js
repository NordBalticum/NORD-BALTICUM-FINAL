"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/router";
import { useMagicLink } from "@/contexts/MagicLinkContext";
import { getWalletBalance } from "@/lib/ethers";
import Navbar from "@/components/Navbar";
import styles from "@/styles/dashboard.module.css";

export default function Dashboard() {
  const router = useRouter();
  const { user, wallet } = useMagicLink();
  const [selectedNetwork, setSelectedNetwork] = useState("bsc");
  const [balance, setBalance] = useState(null);

  // ✅ Redirect jei nėra user
  useEffect(() => {
    if (!user || !wallet) {
      const timeout = setTimeout(() => router.push("/"), 1200);
      return () => clearTimeout(timeout);
    }
  }, [user, wallet, router]);

  // ✅ Automatinis balanso atnaujinimas
  useEffect(() => {
    let interval;
    const fetch = async () => {
      if (wallet?.address) {
        const result = await getWalletBalance(wallet.address, selectedNetwork);
        setBalance(result);
      }
    };
    fetch(); // pirma užkrova
    interval = setInterval(fetch, 6000); // kas 6 sek.
    return () => clearInterval(interval);
  }, [wallet, selectedNetwork]);

  if (!user || !wallet) {
    return (
      <div className={styles.loading} role="status" aria-live="polite">
        Loading your dashboard...
      </div>
    );
  }

  return (
    <div className="fullscreenContainer" role="main" aria-label="Dashboard Page">
      <Navbar />

      <div className={styles.wrapper}>
        <h1 className={styles.welcome}>
          Welcome,<br />
          {user.email}
        </h1>

        <section className={styles.card} aria-labelledby="walletSection">
          <label className={styles.label} htmlFor="walletAddress">Wallet address:</label>
          <p id="walletAddress" className={styles.address}>{wallet.address}</p>

          <div className={styles.networkSelector}>
            <label className={styles.label} htmlFor="networkSelect">Select network:</label>
            <select
              id="networkSelect"
              value={selectedNetwork}
              onChange={(e) => setSelectedNetwork(e.target.value)}
              aria-label="Select Blockchain Network"
            >
              <option value="bsc">BSC Mainnet</option>
              <option value="bscTestnet">BSC Testnet</option>
            </select>
          </div>

          <div className={styles.balanceBox} role="contentinfo" aria-live="polite">
            <span className={styles.balanceLabel}>Balance:</span>
            <span>{balance !== null ? `${balance} BNB` : "Loading..."}</span>
          </div>
        </section>

        <div className={styles.actions} role="group" aria-label="User actions">
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

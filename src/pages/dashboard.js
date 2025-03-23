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
  const [selectedNetwork, setSelectedNetwork] = useState("bscTestnet");
  const [balance, setBalance] = useState("0.0000");
  const [loading, setLoading] = useState(true);

  // ✅ Nukreipiam jei nėra user ar wallet
  useEffect(() => {
    if (!user || !wallet?.address) {
      const timeout = setTimeout(() => router.push("/"), 1000);
      return () => clearTimeout(timeout);
    }
  }, [user, wallet, router]);

  // ✅ Gauti balansą (pirmą kartą ir kas 6 sek.)
  useEffect(() => {
    let interval;

    const fetchBalance = async () => {
      if (!wallet?.address || !selectedNetwork) return;

      try {
        setLoading(true);
        const result = await getWalletBalance(wallet.address, selectedNetwork);
        setBalance(result);
      } catch (error) {
        console.error("❌ Balance fetch error:", error);
        setBalance("0.0000");
      } finally {
        setLoading(false);
      }
    };

    fetchBalance(); // pirmas kartas
    interval = setInterval(fetchBalance, 6000); // kas 6 sek.

    return () => clearInterval(interval);
  }, [wallet?.address, selectedNetwork]);

  if (!user || !wallet?.address) {
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

          <div
            className={styles.balanceBox}
            role="contentinfo"
            aria-live="polite"
            aria-busy={loading}
          >
            <span className={styles.balanceLabel}>Balance:</span>
            <span>{loading ? "Loading..." : `${balance} BNB`}</span>
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

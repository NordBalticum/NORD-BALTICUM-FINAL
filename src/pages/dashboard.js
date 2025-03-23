"use client";

import { useEffect } from "react";
import { useRouter } from "next/router";
import { useMagicLink } from "@/contexts/MagicLinkContext";
import { useBalance } from "@/contexts/BalanceContext";
import Navbar from "@/components/Navbar";
import styles from "@/styles/dashboard.module.css";

export default function Dashboard() {
  const router = useRouter();
  const { user, wallet } = useMagicLink();
  const {
    balance,
    rawBalance,
    loading,
    selectedNetwork,
    setSelectedNetwork,
    refreshBalance,
  } = useBalance();

  // ✅ Redirect jei user ar wallet nėra
  useEffect(() => {
    if (!user || !wallet) {
      const timeout = setTimeout(() => router.push("/"), 1000);
      return () => clearTimeout(timeout);
    }
  }, [user, wallet, router]);

  // ✅ Jei neautorizuotas
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

        {/* ✅ Wallet info kortelė */}
        <section className={styles.card} aria-labelledby="wallet-info">
          <label className={styles.label} htmlFor="walletAddress">Wallet address:</label>
          <p id="walletAddress" className={styles.address}>{wallet.address}</p>

          <div className={styles.networkSelector}>
            <label className={styles.label} htmlFor="networkSelect">Select network:</label>
            <select
              id="networkSelect"
              value={selectedNetwork}
              onChange={(e) => setSelectedNetwork(e.target.value)}
              className={styles.select}
              aria-label="Blockchain network selector"
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
            <span className={styles.balanceValue}>
              {loading ? "Loading..." : `${balance} BNB`}
            </span>
          </div>
        </section>

        {/* ✅ Veiksmai */}
        <div className={styles.actions} role="group" aria-label="Wallet actions">
          <button
            className={styles.actionButton}
            onClick={() => router.push("/send")}
            aria-label="Go to Send Page"
          >
            🧾 SEND
          </button>
          <button
            className={styles.actionButton}
            onClick={() => router.push("/receive")}
            aria-label="Go to Receive Page"
          >
            ✅ RECEIVE
          </button>
        </div>
      </div>
    </div>
  );
}

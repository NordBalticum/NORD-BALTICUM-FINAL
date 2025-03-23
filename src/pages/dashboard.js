"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { useMagicLink } from "@/contexts/MagicLinkContext";
import { getWalletBalance } from "@/lib/ethers";
import Navbar from "@/components/Navbar";
import styles from "@/styles/dashboard.module.css";

export default function Dashboard() {
  const router = useRouter();
  const { user, wallet } = useMagicLink();
  const [selectedNetwork, setSelectedNetwork] = useState("bscTestnet");
  const [balance, setBalance] = useState("Loading...");
  const [loading, setLoading] = useState(true);

  // ✅ Redirect jei nėra vartotojo arba wallet
  useEffect(() => {
    if (!user || !wallet) {
      const timeout = setTimeout(() => router.push("/"), 1200);
      return () => clearTimeout(timeout);
    }
  }, [user, wallet, router]);

  // ✅ Balanso atnaujinimas kas 6s
  useEffect(() => {
    let interval;

    const fetchBalance = async () => {
      if (!wallet?.address) return;
      setLoading(true);
      const fetched = await getWalletBalance(wallet.address, selectedNetwork);
      setBalance(fetched);
      setLoading(false);
    };

    fetchBalance();
    interval = setInterval(fetchBalance, 6000);
    return () => clearInterval(interval);
  }, [wallet?.address, selectedNetwork]);

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

        <section className={styles.card}>
          <label className={styles.label}>Wallet address:</label>
          <p className={styles.address}>{wallet.address}</p>

          <div className={styles.networkSelector}>
            <label className={styles.label}>Select network:</label>
            <select
              value={selectedNetwork}
              onChange={(e) => setSelectedNetwork(e.target.value)}
              aria-label="Select Blockchain Network"
            >
              <option value="bsc">BSC Mainnet</option>
              <option value="bscTestnet">BSC Testnet</option>
            </select>
          </div>

          <div className={styles.balanceBox} aria-live="polite">
            <span className={styles.balanceLabel}>Balance:</span>
            <span>{loading ? "Loading..." : `${balance} BNB`}</span>
          </div>
        </section>

        <div className={styles.actions}>
          <button
            className={styles.actionButton}
            onClick={() => router.push("/send")}
          >
            🧾 SEND
          </button>
          <button
            className={styles.actionButton}
            onClick={() => router.push("/receive")}
          >
            ✅ RECEIVE
          </button>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useMagicLink } from "@/contexts/MagicLinkContext";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { JsonRpcProvider, formatEther } from "ethers";
import styles from "@/styles/dashboard.module.css";
import Navbar from "@/components/Navbar";

export default function Dashboard() {
  const { user, wallet } = useMagicLink();
  const router = useRouter();
  const [selectedNetwork, setSelectedNetwork] = useState("bsc");
  const [balance, setBalance] = useState(null);

  const rpcUrls = {
    bsc: process.env.NEXT_PUBLIC_BSC_RPC,
    bscTestnet: process.env.NEXT_PUBLIC_BSC_TESTNET_RPC,
  };

  // Redirect if not authenticated
  useEffect(() => {
    if (!user || !wallet) {
      const timer = setTimeout(() => router.push("/"), 1200);
      return () => clearTimeout(timer);
    }
  }, [user, wallet, router]);

  // Fetch balance
  useEffect(() => {
    if (wallet?.address && rpcUrls[selectedNetwork]) {
      const provider = new JsonRpcProvider(rpcUrls[selectedNetwork]);
      provider
        .getBalance(wallet.address)
        .then((bal) => setBalance(formatEther(bal)))
        .catch((err) => {
          console.error("Balance fetch error:", err);
          setBalance("Error");
        });
    }
  }, [wallet?.address, selectedNetwork]);

  // Loading screen
  if (!user || !wallet) {
    return <div className={styles.loading}>Loading your dashboard...</div>;
  }

  return (
    <div className={styles.dashboardWrapper}>
      <Navbar />

      <main className={styles.content}>
        <h1 className={styles.welcome}>
          Welcome, <span>{user.email}</span>
        </h1>

        <section className={styles.card} aria-label="Wallet Information">
          <label className={styles.label} htmlFor="walletAddress">
            Wallet address:
          </label>
          <p className={styles.address} id="walletAddress">
            {wallet.address}
          </p>

          <div className={styles.networkSelector}>
            <label htmlFor="networkSelect">Select network:</label>
            <select
              id="networkSelect"
              value={selectedNetwork}
              onChange={(e) => setSelectedNetwork(e.target.value)}
              aria-label="Choose blockchain network"
            >
              <option value="bsc">BSC Mainnet</option>
              <option value="bscTestnet">BSC Testnet</option>
            </select>
          </div>

          <div className={styles.balanceBox}>
            <span className={styles.balanceLabel}>Balance:</span>
            <span className={styles.balanceValue}>
              {balance !== null ? `${balance} BNB` : "Loading..."}
            </span>
          </div>
        </section>

        <div className={styles.actions} aria-label="Wallet Actions">
          <button
            className={styles.actionButton}
            onClick={() => router.push("/send")}
            aria-label="Send crypto"
          >
            📤 Send
          </button>
          <button
            className={styles.actionButton}
            onClick={() => router.push("/receive")}
            aria-label="Receive crypto"
          >
            📥 Receive
          </button>
        </div>
      </main>
    </div>
  );
}

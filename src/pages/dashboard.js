"use client";

import { useMagicLink } from "@/contexts/MagicLinkContext";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { JsonRpcProvider, formatEther } from "ethers";
import styles from "@/styles/dashboard.module.css";
import Navbar from "@/components/Navbar";
import clsx from "clsx";

export default function Dashboard() {
  const { user, wallet, signOut } = useMagicLink();
  const router = useRouter();
  const [selectedNetwork, setSelectedNetwork] = useState("bsc");
  const [balance, setBalance] = useState(null);

  const rpcUrls = {
    bsc: process.env.NEXT_PUBLIC_BSC_RPC,
    bscTestnet: process.env.NEXT_PUBLIC_BSC_TESTNET_RPC,
  };

  useEffect(() => {
    if (!user || !wallet) {
      const timer = setTimeout(() => router.push("/"), 1500);
      return () => clearTimeout(timer);
    }
  }, [user, wallet, router]);

  useEffect(() => {
    if (wallet && rpcUrls[selectedNetwork]) {
      const provider = new JsonRpcProvider(rpcUrls[selectedNetwork]);
      provider
        .getBalance(wallet.address)
        .then((bal) => setBalance(formatEther(bal)))
        .catch((err) => {
          console.error("Balance fetch error:", err);
          setBalance("Error");
        });
    }
  }, [wallet, selectedNetwork]);

  if (!user || !wallet) {
    return (
      <div className={styles.loading}>Loading your dashboard...</div>
    );
  }

  return (
    <div className={styles.dashboardWrapper}>
      <Navbar />
      <div className={styles.content}>
        <h1 className={styles.welcome}>Welcome, {user.email}</h1>

        <div className={styles.card}>
          <label className={styles.label}>Wallet address:</label>
          <p className={styles.address}>{wallet.address}</p>

          <div className={styles.networkSelector}>
            <label>Select network:</label>
            <select
              value={selectedNetwork}
              onChange={(e) => setSelectedNetwork(e.target.value)}
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
        </div>

        <div className={styles.actions}>
          <button onClick={() => router.push("/send")} className={styles.actionButton}>
            📤 Send
          </button>
          <button onClick={() => router.push("/receive")} className={styles.actionButton}>
            📥 Receive
          </button>
        </div>

        <button onClick={signOut} className={styles.logout}>
          🚪 Sign Out
        </button>
      </div>
    </div>
  );
}

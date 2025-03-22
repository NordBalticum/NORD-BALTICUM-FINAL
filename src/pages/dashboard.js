"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/router";
import { JsonRpcProvider, formatEther } from "ethers";
import { useMagicLink } from "@/contexts/MagicLinkContext";
import Navbar from "@/components/Navbar";
import styles from "@/styles/dashboard.module.css";

export default function Dashboard() {
  const router = useRouter();
  const { user, wallet } = useMagicLink();
  const [selectedNetwork, setSelectedNetwork] = useState("bsc");
  const [balance, setBalance] = useState(null);

  const rpcUrls = {
    bsc: process.env.NEXT_PUBLIC_BSC_RPC,
    bscTestnet: process.env.NEXT_PUBLIC_BSC_TESTNET_RPC,
  };

  // ✅ Automatinis redirect jeigu nėra user arba wallet
  useEffect(() => {
    if (!user || !wallet) {
      const timeout = setTimeout(() => router.push("/"), 1000);
      return () => clearTimeout(timeout);
    }
  }, [user, wallet, router]);

  // ✅ Gauti balansą
  const fetchBalance = useCallback(async () => {
    try {
      const rpc = rpcUrls[selectedNetwork];
      if (wallet && rpc) {
        const provider = new JsonRpcProvider(rpc);
        const raw = await provider.getBalance(wallet.address);
        const formatted = parseFloat(formatEther(raw)).toFixed(4);
        setBalance(formatted);
      }
    } catch (err) {
      console.error("Failed to fetch balance:", err);
      setBalance("Error");
    }
  }, [wallet, selectedNetwork]);

  useEffect(() => {
    fetchBalance();
  }, [fetchBalance]);

  if (!user || !wallet) {
    return <div className={styles.loading}>Loading your dashboard...</div>;
  }

  return (
    <div className="fullscreenContainer">
      <Navbar />
      <div className="fullscreenContent glassBox fadeIn" role="main" aria-label="Dashboard content">
        <h1 className={styles.welcome}>Welcome, <br />{user.email}</h1>

        <div className={styles.card}>
          <label className={styles.label}>Wallet address:</label>
          <p className={styles.address}>{wallet.address}</p>

          <div className={styles.networkSelector}>
            <label className={styles.label}>Select network:</label>
            <select
              value={selectedNetwork}
              onChange={(e) => setSelectedNetwork(e.target.value)}
              aria-label="Choose network"
            >
              <option value="bsc">BSC Mainnet</option>
              <option value="bscTestnet">BSC Testnet</option>
            </select>
          </div>

          <div className={styles.balanceBox}>
            <span className={styles.balanceLabel}>Balance:</span>
            <span>{balance !== null ? `${balance} BNB` : "Loading..."}</span>
          </div>
        </div>

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

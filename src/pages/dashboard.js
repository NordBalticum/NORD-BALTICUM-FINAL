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
  const [loading, setLoading] = useState(true);

  const rpcUrls = {
    bsc: process.env.NEXT_PUBLIC_BSC_RPC,
    bscTestnet: process.env.NEXT_PUBLIC_BSC_TESTNET_RPC,
  };

  // ✅ Redirect jei nėra user
  useEffect(() => {
    if (!user || !wallet) {
      const timeout = setTimeout(() => router.push("/"), 1200);
      return () => clearTimeout(timeout);
    }
  }, [user, wallet, router]);

  // ✅ Balanso užkrovimas
  const fetchBalance = useCallback(async () => {
    try {
      const rpc = rpcUrls[selectedNetwork];
      if (wallet?.address && rpc) {
        const provider = new JsonRpcProvider(rpc);
        const raw = await provider.getBalance(wallet.address);
        const formatted = parseFloat(formatEther(raw)).toFixed(4);
        setBalance(formatted);
      }
    } catch (error) {
      console.error("Balance fetch error:", error);
      setBalance("Error");
    } finally {
      setLoading(false);
    }
  }, [wallet, selectedNetwork]);

  useEffect(() => {
    fetchBalance();
  }, [fetchBalance]);

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

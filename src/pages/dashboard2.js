"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/router";
import { useMagicLink } from "@/contexts/MagicLinkContext";
import { FallbackProvider, JsonRpcProvider, formatEther } from "ethers";
import Navbar from "@/components/Navbar";
import styles from "@/styles/dashboard.module.css";

export default function Dashboard2() {
  const router = useRouter();
  const { user, wallet } = useMagicLink();

  const [balance, setBalance] = useState("0.0000");
  const [loading, setLoading] = useState(true);
  const [selectedNetwork, setSelectedNetwork] = useState("bsc");

  // Dynamic fallback provider creation based on selected network
  const getFallbackProvider = useCallback(() => {
    const rpcConfigs = {
      bsc: [
        new JsonRpcProvider("https://rpc.ankr.com/bsc", { priority: 1, weight: 2 }),
        new JsonRpcProvider("https://bsc.publicnode.com", { priority: 2, weight: 1 }),
        new JsonRpcProvider("https://bsc-dataseed.binance.org", { priority: 3, weight: 1 }),
      ],
      bscTestnet: [
        new JsonRpcProvider("https://rpc.ankr.com/bsc_testnet_chapel", { priority: 1, weight: 2 }),
        new JsonRpcProvider("https://bsc-testnet.publicnode.com", { priority: 2, weight: 1 }),
        new JsonRpcProvider("https://data-seed-prebsc-1-s1.binance.org:8545", { priority: 3, weight: 1 }),
      ],
    };
    return new FallbackProvider(rpcConfigs[selectedNetwork]);
  }, [selectedNetwork]);

  const fetchBalance = useCallback(async () => {
    if (!wallet?.address) return;

    setLoading(true);
    try {
      const provider = getFallbackProvider();
      const balance = await provider.getBalance(wallet.address);
      setBalance(parseFloat(formatEther(balance)).toFixed(4));
    } catch (error) {
      console.error("❌ Error fetching balance:", error);
      setBalance("0.0000");
    } finally {
      setLoading(false);
    }
  }, [wallet?.address, getFallbackProvider]);

  useEffect(() => {
    if (!user || !wallet) {
      const timeout = setTimeout(() => router.push("/"), 1000);
      return () => clearTimeout(timeout);
    }
  }, [user, wallet, router]);

  useEffect(() => {
    fetchBalance();
    const interval = setInterval(fetchBalance, 6000);
    return () => clearInterval(interval);
  }, [fetchBalance]);

  if (!user || !wallet) {
    return (
      <div className={styles.loading} role="status">
        Loading your dashboard...
      </div>
    );
  }

  return (
    <div className="fullscreenContainer" role="main">
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
              className={styles.select}
              value={selectedNetwork}
              onChange={(e) => setSelectedNetwork(e.target.value)}
            >
              <option value="bsc">BSC Mainnet</option>
              <option value="bscTestnet">BSC Testnet</option>
            </select>
          </div>

          <div className={styles.balanceBox} aria-live="polite" aria-busy={loading}>
            <span className={styles.balanceLabel}>Balance:</span>
            <span className={styles.balanceValue}>
              {loading ? "Loading..." : `${balance} BNB`}
            </span>
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
          <button
            className={styles.actionButton}
            onClick={fetchBalance}
          >
            🔄 REFRESH
          </button>
        </div>
      </div>
    </div>
  );
}

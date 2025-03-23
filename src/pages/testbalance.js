"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { useMagicLink } from "@/contexts/MagicLinkContext";
import { JsonRpcProvider, formatEther } from "ethers";
import Navbar from "@/components/Navbar";
import styles from "@/styles/dashboard.module.css";

export default function TestBalance() {
  const router = useRouter();
  const { user, wallet } = useMagicLink();

  const [balance, setBalance] = useState("0.0000");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const TESTNET_RPCS = [
    "https://rpc.ankr.com/bsc_testnet_chapel",
    "https://bsc-testnet.publicnode.com",
    "https://data-seed-prebsc-1-s1.binance.org:8545/"
  ];

  const getWorkingProvider = async () => {
    for (const url of TESTNET_RPCS) {
      try {
        const provider = new JsonRpcProvider(url);
        await provider.getBlockNumber(); // ping
        return provider;
      } catch (err) {
        console.warn(`⚠️ RPC failed: ${url}`);
      }
    }
    throw new Error("No working testnet RPC found.");
  };

  const fetchBalance = async () => {
    setLoading(true);
    setError("");
    try {
      if (!wallet?.address) throw new Error("Wallet not found");
      const provider = await getWorkingProvider();
      const raw = await provider.getBalance(wallet.address);
      setBalance(parseFloat(formatEther(raw)).toFixed(4));
    } catch (err) {
      console.error("❌ Failed to fetch balance:", err);
      setError(err.message || "Unknown error");
      setBalance("0.0000");
    } finally {
      setLoading(false);
    }
  };

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
  }, [wallet?.address]);

  if (!user || !wallet) {
    return <div className={styles.loading}>Loading...</div>;
  }

  return (
    <div className="fullscreenContainer">
      <Navbar />
      <div className={styles.wrapper}>
        <h1 className={styles.welcome}>
          Live Balance – BSC Testnet
        </h1>

        <p className={styles.label}>Wallet Address:</p>
        <p className={styles.address}>{wallet.address}</p>

        <p className={styles.label}>Balance:</p>
        <p className={styles.balanceValue}>
          {loading ? "Loading..." : `${balance} BNB`}
        </p>

        {error && (
          <p style={{ color: "red", marginTop: "12px" }}>
            Error: {error}
          </p>
        )}

        <button
          className={styles.actionButton}
          onClick={fetchBalance}
          style={{ marginTop: "16px" }}
        >
          🔄 Refresh Balance
        </button>
      </div>
    </div>
  );
}

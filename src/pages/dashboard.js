"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { JsonRpcProvider, formatEther } from "ethers";
import { useMagicLink } from "@/contexts/MagicLinkContext";
import Navbar from "@/components/Navbar";
import styles from "@/styles/dashboard.module.css";

const RPC_URLS = {
  bsc: [
    process.env.NEXT_PUBLIC_BSC_RPC_1,
    process.env.NEXT_PUBLIC_BSC_RPC_2,
    "https://bsc-dataseed.binance.org",
  ],
  bscTestnet: [
    process.env.NEXT_PUBLIC_BSC_TESTNET_RPC_1,
    process.env.NEXT_PUBLIC_BSC_TESTNET_RPC_2,
    "https://data-seed-prebsc-1-s1.binance.org:8545",
  ],
};

const getProviderWithFallback = async (network = "bsc") => {
  const urls = RPC_URLS[network] || [];
  for (const url of urls) {
    try {
      const provider = new JsonRpcProvider(url);
      await provider.getBlockNumber(); // ping
      return provider;
    } catch (err) {
      console.warn(`❌ RPC failed: ${url}`);
    }
  }
  throw new Error("❌ No valid RPC provider available.");
};

export default function Dashboard() {
  const router = useRouter();
  const { user, wallet } = useMagicLink();

  const [selectedNetwork, setSelectedNetwork] = useState("bscTestnet");
  const [balance, setBalance] = useState("0.0000");
  const [rawBalance, setRawBalance] = useState("0");
  const [loading, setLoading] = useState(true);

  // ✅ Redirect jei nėra user arba wallet
  useEffect(() => {
    if (!user || !wallet) {
      const timeout = setTimeout(() => router.push("/"), 1000);
      return () => clearTimeout(timeout);
    }
  }, [user, wallet, router]);

  // ✅ Real-time balanso gavimas iš ethers RPC
  const fetchBalance = async () => {
    if (!wallet?.address || !selectedNetwork) return;
    setLoading(true);
    try {
      const provider = await getProviderWithFallback(selectedNetwork);
      const raw = await provider.getBalance(wallet.address);
      const formatted = parseFloat(formatEther(raw)).toFixed(4);
      setRawBalance(raw.toString());
      setBalance(formatted);
    } catch (err) {
      console.error("❌ Live balance fetch error:", err);
      setRawBalance("0");
      setBalance("0.0000");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBalance();
    const interval = setInterval(fetchBalance, 6000);
    return () => clearInterval(interval);
  }, [selectedNetwork, wallet?.address]);

  if (!user || !wallet) {
    return <div className={styles.loading}>Loading your dashboard...</div>;
  }

  return (
    <div className="fullscreenContainer">
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

          <div className={styles.balanceBox}>
            <span className={styles.balanceLabel}>Balance:</span>
            <span className={styles.balanceValue}>
              {loading ? "Loading..." : `${balance} BNB`}
            </span>
          </div>

          <div className={styles.rawInfo}>
            <span className={styles.rawLabel}>Raw:</span>
            <span className={styles.rawValue}>{rawBalance}</span>
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

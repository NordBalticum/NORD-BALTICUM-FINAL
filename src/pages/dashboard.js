"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { useMagicLink } from "@/contexts/MagicLinkContext";
import { useWalletCheck } from "@/contexts/WalletCheckContext";
import { useWallet } from "@/contexts/WalletContext";
import { useBalance } from "@/hooks/useBalance";

import StarsBackground from "@/components/StarsBackground";
import styles from "@/styles/dashboard.module.css";
import background from "@/styles/background.module.css";

export default function Dashboard() {
  const router = useRouter();
  const { user, loading } = useMagicLink();
  const { walletReady } = useWalletCheck();
  const { publicKey, balance, activeNetwork, changeNetwork } = useWallet();
  const { balances, isLoading: balanceLoading, refresh } = useBalance();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/");
    }
  }, [loading, user, router]);

  const handleNetworkChange = (e) => {
    changeNetwork(e.target.value);
    refresh();
  };

  if (!user || !walletReady || loading) {
    return <div className={styles.loading}>Loading dashboard...</div>;
  }

  return (
    <main className={`${styles.main} ${background.gradient}`}>
      <StarsBackground />

      <div className={styles.wrapper}>
        <h1 className={styles.title}>Welcome back</h1>
        <p className={styles.subtext}>Wallet connected with email: <strong>{user.email}</strong></p>

        <section className={styles.card}>
          <h2 className={styles.cardTitle}>Active Wallet</h2>
          <p className={styles.label}>Network:</p>
          <select
            value={activeNetwork}
            onChange={handleNetworkChange}
            className={styles.dropdown}
          >
            <option value="bsc">BNB Chain</option>
            <option value="eth">Ethereum</option>
            <option value="matic">Polygon</option>
            <option value="avax">Avalanche</option>
            <option value="tbnb">BNB Testnet</option>
          </select>

          <p className={styles.label}>Wallet Address:</p>
          <p className={styles.address}>{publicKey || "N/A"}</p>

          <p className={styles.label}>Balance:</p>
          <p className={styles.balance}>
            {balance} {activeNetwork.toUpperCase()}
          </p>
        </section>

        <section className={styles.card}>
          <h2 className={styles.cardTitle}>Your Balances</h2>

          {balanceLoading ? (
            <p>Refreshing balances...</p>
          ) : (
            <div className={styles.balanceTable}>
              {["bsc", "eth", "matic", "avax", "tbnb"].map((net) => (
                <div key={net} className={styles.balanceRow}>
                  <p>{net.toUpperCase()}</p>
                  <p>{balances[net]?.amount || "0.00000"}</p>
                  <p>€ {balances[net]?.eur || "0.00"}</p>
                </div>
              ))}
              <div className={styles.totalRow}>
                <strong>Total (EUR)</strong>
                <strong>€ {balances?.totalEUR || "0.00"}</strong>
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

"use client";

import { useEffect } from "react";
import { useRouter } from "next/router";
import { useMagicLink } from "@/contexts/MagicLinkContext";
import { useBalance } from "@/contexts/BalanceProviderEthers";
import styles from "@/styles/dashboard.module.css";

export default function Dashboard() {
  const router = useRouter();
  const { user, wallet } = useMagicLink();
  const { balance, selectedNetwork, setSelectedNetwork } = useBalance();

  useEffect(() => {
    if (!user || !wallet) {
      const timeout = setTimeout(() => router.push("/"), 800);
      return () => clearTimeout(timeout);
    }
  }, [user, wallet, router]);

  if (!user || !wallet) {
    return (
      <div className={styles.loading}>
        Loading Wallet...
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.accountGroup}>
          <h2 className={styles.label}>My Wallet</h2>
          <p className={styles.address}>
            {wallet.address.slice(0, 6)}...{wallet.address.slice(-4)}
          </p>
        </div>

        <div className={styles.networkSelect}>
          <select
            className={styles.select}
            value={selectedNetwork}
            onChange={(e) => setSelectedNetwork(e.target.value)}
          >
            <option value="bsc">BSC Mainnet</option>
            <option value="bscTestnet">BSC Testnet</option>
          </select>
        </div>
      </div>

      <div className={styles.balanceCard}>
        <span className={styles.balanceLabel}>Available Balance</span>
        <span className={styles.balanceValue}>{balance} BNB</span>
      </div>

      <div className={styles.actionGroup}>
        <button
          className={styles.action}
          onClick={() => router.push("/send")}
        >
          Send
        </button>
        <button
          className={styles.action}
          onClick={() => router.push("/receive")}
        >
          Receive
        </button>
      </div>

      <p className={styles.note}>
        Transactions and staking options coming soon.
      </p>
    </div>
  );
}

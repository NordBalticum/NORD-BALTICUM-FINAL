"use client";

import { useEffect } from "react";
import { useRouter } from "next/router";
import { useMagicLink } from "@/contexts/MagicLinkContext";
import { useBalance } from "@/contexts/BalanceProviderEthers";
import styles from "@/styles/dashboard.module.css";

export default function Dashboard() {
  const router = useRouter();
  const { user, wallet } = useMagicLink();
  const {
    balance,
    selectedNetwork,
    setSelectedNetwork,
    loading,
  } = useBalance();

  useEffect(() => {
    if (!user || !wallet) {
      const timeout = setTimeout(() => router.push("/"), 500);
      return () => clearTimeout(timeout);
    }
  }, [user, wallet, router]);

  if (!user || !wallet) {
    return <div className={styles.loading}>Loading Wallet...</div>;
  }

  const copyAddress = () => {
    navigator.clipboard.writeText(wallet.address);
  };

  return (
    <div className={styles.container}>
      <div className={styles.balanceCard}>
        <div className={styles.network}>
          <select
            className={styles.select}
            value={selectedNetwork}
            onChange={(e) => setSelectedNetwork(e.target.value)}
          >
            <option value="bsc">BNB Smart Chain</option>
            <option value="bscTestnet">BNB Testnet</option>
          </select>
        </div>

        <div className={styles.addressBox} onClick={copyAddress} title="Tap to copy">
          <span className={styles.addressLabel}>Wallet:</span>
          <span className={styles.address}>{wallet.address}</span>
        </div>

        <div className={styles.balance}>
          <span className={styles.balanceValue}>{balance}</span>
          <span className={styles.balanceUnit}>BNB</span>
        </div>

        <div className={styles.actions}>
          <button
            className={styles.btnSend}
            onClick={() => router.push("/send")}
          >
            SEND
          </button>
          <button
            className={styles.btnReceive}
            onClick={() => router.push("/receive")}
          >
            RECEIVE
          </button>
        </div>
      </div>
    </div>
  );
}

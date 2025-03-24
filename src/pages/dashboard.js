"use client";

import { useEffect } from "react";
import { useRouter } from "next/router";
import { useMagicLink } from "@/contexts/MagicLinkContext";
import { useBalance } from "@/contexts/BalanceProviderEthers";
import SideDrawer from "@/components/SideDrawer";
import BottomNavigation from "@/components/BottomNavigation";
import styles from "@/styles/dashboard.module.css";

export default function Dashboard() {
  const router = useRouter();
  const { user, wallet } = useMagicLink();
  const {
    balance,
    loading,
    selectedNetwork,
    setSelectedNetwork,
  } = useBalance();

  useEffect(() => {
    if (!user || !wallet) {
      const timeout = setTimeout(() => router.push("/"), 800);
      return () => clearTimeout(timeout);
    }
  }, [user, wallet, router]);

  if (!user || !wallet) {
    return <div className={styles.loading}>Loading your dashboard...</div>;
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(wallet.address);
  };

  return (
    <div className={styles.dashboardContainer}>
      <SideDrawer />
      <div className={styles.wrapper}>
        <div className={styles.card}>
          <div className={styles.header}>
            <h2 className={styles.balanceLabel}>Total Balance</h2>
            <p className={styles.balanceValue}>{balance} BNB</p>
          </div>

          <div className={styles.walletBox} onClick={handleCopy}>
            <p className={styles.walletAddress}>
              {wallet.address.slice(0, 6)}...{wallet.address.slice(-4)}
            </p>
            <span className={styles.copyHint}>Tap to Copy</span>
          </div>

          <div className={styles.networkSelector}>
            <label>Select Network</label>
            <select
              value={selectedNetwork}
              onChange={(e) => setSelectedNetwork(e.target.value)}
              className={styles.select}
            >
              <option value="bsc">BSC Mainnet</option>
              <option value="bscTestnet">BSC Testnet</option>
            </select>
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
      <BottomNavigation />
    </div>
  );
}

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
      const timeout = setTimeout(() => router.push("/"), 600);
      return () => clearTimeout(timeout);
    }
  }, [user, wallet, router]);

  if (!user || !wallet) {
    return (
      <div className={styles.loading}>
        Loading your wallet...
      </div>
    );
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(wallet.address);
  };

  return (
    <div className={styles.dashboardContainer}>
      <SideDrawer />

      <div className={styles.wrapper}>
        <h1 className={styles.title}>My Wallet</h1>

        <div className={styles.walletCard}>
          <div className={styles.addressSection} onClick={handleCopy} title="Tap to copy">
            <span className={styles.label}>Wallet Address:</span>
            <p className={styles.address}>{wallet.address}</p>
          </div>

          <div className={styles.balanceSection}>
            <span className={styles.label}>Balance:</span>
            <p className={styles.balance}>{balance} BNB</p>
          </div>

          <div className={styles.networkSelector}>
            <label htmlFor="network" className={styles.label}>Network:</label>
            <select
              id="network"
              className={styles.select}
              value={selectedNetwork}
              onChange={(e) => setSelectedNetwork(e.target.value)}
            >
              <option value="bsc">BSC Mainnet</option>
              <option value="bscTestnet">BSC Testnet</option>
            </select>
          </div>
        </div>

        <div className={styles.actions}>
          <button onClick={() => router.push("/send")} className={styles.actionBtn}>
            Send
          </button>
          <button onClick={() => router.push("/receive")} className={styles.actionBtn}>
            Receive
          </button>
        </div>
      </div>

      <BottomNavigation />
    </div>
  );
}

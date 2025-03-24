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
    return <div className={styles.loading}>Loading wallet...</div>;
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(wallet.address);
  };

  return (
    <div className={styles.dashboardPage}>
      <SideDrawer />

      <div className={styles.mainContent}>
        <div className={styles.balanceCard}>
          <div className={styles.walletLabel}>Wallet Address</div>
          <div className={styles.addressBox} onClick={handleCopy}>
            <p className={styles.address}>{wallet.address}</p>
          </div>

          <div className={styles.balanceSection}>
            <p className={styles.balanceLabel}>BNB Balance</p>
            <h2 className={styles.balanceAmount}>{balance} BNB</h2>
          </div>

          <div className={styles.actions}>
            <button
              className={styles.sendBtn}
              onClick={() => router.push("/send")}
            >
              Send
            </button>
            <button
              className={styles.receiveBtn}
              onClick={() => router.push("/receive")}
            >
              Receive
            </button>
          </div>
        </div>
      </div>

      <BottomNavigation />
    </div>
  );
}

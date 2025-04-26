// src/app/dashboard.js
"use client";

import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import { useSystemReady } from "@/hooks/useSystemReady";
import { useAuth } from "@/contexts/AuthContext";
import BalanceCard from "@/components/BalanceCard";
import styles from "@/styles/dashboard.module.css";
import MiniLoadingSpinner from "@/components/MiniLoadingSpinner";

// chartą deferinam, kad nebūtų SSR bloko
const LivePriceTable = dynamic(
  () => import("@/components/LivePriceTable"),
  { ssr: false }
);

export default function Dashboard() {
  const { wallet } = useAuth();
  const { ready, loading: systemLoading, isMobile } = useSystemReady();

  // rodome spinnerį tik tol, kol visi core moduliai (auth, wallet, balances+prices) nepasiruošę
  if (systemLoading || !ready || !wallet?.wallet?.address) {
    return (
      <main className={styles.container}>
        <div className={styles.dashboardWrapper}>
          <motion.div
            className={styles.fullscreenCenter}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          >
            <MiniLoadingSpinner />
            <p className={styles.loadingSub}>
              {isMobile ? "Mobile Mode" : "Desktop Mode"}
            </p>
          </motion.div>
        </div>
      </main>
    );
  }

  // kai viskas paruošta, atvaizduojam chartą ir balansų kortelę
  return (
    <main className={styles.container}>
      <div className={styles.dashboardWrapper}>
        <div className={styles.dashboardRow}>
          {/* ~70% pločio desktop, mobilėje full */}
          <div className={styles.chartSection}>
            <LivePriceTable />
          </div>
          {/* ~30% pločio desktop, mobilėje full */}
          <div className={styles.balanceSection}>
            <BalanceCard />
          </div>
        </div>
      </div>
    </main>
  );
}

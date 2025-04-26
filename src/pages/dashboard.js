// src/app/dashboard.js
"use client";

import dynamic from "next/dynamic";
import { motion } from "framer-motion";

import { useSystemReady } from "@/hooks/useSystemReady";
import { useAuth }        from "@/contexts/AuthContext";

import BalanceCard        from "@/components/BalanceCard";
import MiniLoadingSpinner from "@/components/MiniLoadingSpinner";
import styles             from "@/styles/dashboard.module.css";

// defer-load the live chart, skip SSR
const LivePriceTable = dynamic(
  () => import("@/components/LivePriceTable"),
  { ssr: false }
);

export default function Dashboard() {
  const { wallet }          = useAuth();
  const { ready, loading, isMobile } = useSystemReady();

  // block UI until auth + wallet + balances/prices are all ready
  if (loading || !ready || !wallet?.wallet?.address) {
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

  // once everything is ready, render chart + balances
  return (
    <main className={styles.container}>
      <div className={styles.dashboardWrapper}>
        <div className={styles.dashboardRow}>
          {/* ~70% on desktop, full on mobile */}
          <div className={styles.chartSection}>
            <LivePriceTable />
          </div>
          {/* ~30% on desktop, full on mobile */}
          <div className={styles.balanceSection}>
            <BalanceCard />
          </div>
        </div>
      </div>
    </main>
  );
}

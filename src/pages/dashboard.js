"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";

import { useSystemReady } from "@/hooks/useSystemReady";
import { useAuth }        from "@/contexts/AuthContext";
import BalanceCard        from "@/components/BalanceCard";
import styles             from "@/styles/dashboard.module.css";
import MiniLoadingSpinner from "@/components/MiniLoadingSpinner";

const LivePriceTable = dynamic(() => import("@/components/LivePriceTable"), {
  ssr: false,
});

export default function Dashboard() {
  const router = useRouter();
  const { wallet } = useAuth();
  const {
    ready,
    loading: systemLoading,
    isMobile,
  } = useSystemReady();

  const walletReady = !!wallet?.wallet?.address;

  // While we're not ready, show spinner + mode
  if (systemLoading || !ready || !walletReady) {
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

  // Ready → render chart + balances
  return (
    <main className={styles.container}>
      <div className={styles.dashboardWrapper}>
        {/* Live price chart */}
        <div className={styles.chartSection}>
          <LivePriceTable />
        </div>

        {/* Our new BalanceCard */}
        <BalanceCard />

      </div>
    </main>
  );
}

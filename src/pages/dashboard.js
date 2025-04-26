"use client";

import React, { useMemo, Suspense } from "react";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";

import { useSystemReady } from "@/hooks/useSystemReady";
import { useSessionManager } from "@/hooks/useSessionManager";
import { useSilentBalanceRefetch } from "@/hooks/useSilentBalanceRefetch";
import { useDeviceInfo } from "@/hooks/useDeviceInfo";

import { useAuth } from "@/contexts/AuthContext";
import { useBalance } from "@/contexts/BalanceContext";

import BalanceCard from "@/components/BalanceCard";
import MiniLoadingSpinner from "@/components/MiniLoadingSpinner";
import styles from "@/styles/dashboard.module.css";

// Dynamic import for LivePriceTable
const LivePriceTable = dynamic(() => import("@/components/LivePriceTable"), { ssr: false });

export default function Dashboard() {
  const { ready } = useSystemReady();
  const { isMobile } = useDeviceInfo(); // 🔥 Ultimate mobile detection
  useSessionManager();                  // 🔥 Session auto-refresh
  useSilentBalanceRefetch();            // 🔥 Silent background refetch

  const { user, wallet } = useAuth();
  const { balancesReady, lastUpdated } = useBalance();

  const address = wallet?.wallet?.address ?? null;

  const truncatedAddress = useMemo(() => {
    return address ? `${address.slice(0, 6)}…${address.slice(-4)}` : "--";
  }, [address]);

  const updatedAt = useMemo(() => {
    if (!lastUpdated) return "--:--:--";
    const d = new Date(lastUpdated);
    return d.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit"
    });
  }, [lastUpdated]);

  const isLoading = !ready || !balancesReady || !address;

  if (isLoading) {
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
              {isMobile ? "Loading Mobile..." : "Loading Desktop..."}
            </p>
          </motion.div>
        </div>
      </main>
    );
  }

  return (
    <main className={styles.container}>
      <div className={styles.dashboardWrapper}>

        {/* Top Greeting */}
        <motion.div
          className={styles.greetingWrapper}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <h2 className={styles.greeting}>
            Hello, {user?.email?.split("@")[0] ?? "User"}!
          </h2>
          <p className={styles.walletInfo}>
            {truncatedAddress}
          </p>
        </motion.div>

        {/* Main Content Row */}
        <div className={styles.dashboardRow}>

          {/* Left - Balance Card */}
          <motion.div
            className={styles.balanceSection}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <BalanceCard />
            <div className={styles.footerInfo}>
              Last updated: {updatedAt}
            </div>
          </motion.div>

          {/* Right - Live Price Table */}
          <motion.div
            className={styles.chartSection}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Suspense fallback={<MiniLoadingSpinner />}>
              <LivePriceTable />
            </Suspense>
          </motion.div>

        </div>

      </div>
    </main>
  );
}

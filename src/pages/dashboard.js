"use client";

import React, { useMemo, Suspense } from "react";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";

import { useSystemReady } from "@/hooks/useSystemReady";           // ✅ Ultimate system+session+device
import { useAuth } from "@/contexts/AuthContext";
import { useBalance } from "@/contexts/BalanceContext";
import { useNetwork } from "@/contexts/NetworkContext";

import BalanceCard from "@/components/BalanceCard";
import MiniLoadingSpinner from "@/components/MiniLoadingSpinner";
import styles from "@/styles/dashboard.module.css";

const LivePriceTable = dynamic(() => import("@/components/LivePriceTable"), { ssr: false });

export default function Dashboard() {
  const { ready, loading, isMobile, scale } = useSystemReady();
  const { user, wallet } = useAuth();
  const { balancesReady, lastUpdated } = useBalance();
  const { activeNetwork } = useNetwork();

  const address = wallet?.wallet?.address ?? "";

  const truncatedAddress = useMemo(() => (
    address ? `${address.slice(0, 6)}…${address.slice(-4)}` : "--"
  ), [address]);

  const updatedAt = useMemo(() => {
    if (!lastUpdated) return "--:--:--";
    const d = new Date(lastUpdated);
    return d.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  }, [lastUpdated]);

  const networkLabel = useMemo(() => (
    activeNetwork?.label ?? "Unknown Network"
  ), [activeNetwork]);

  const isFullyLoading = useMemo(() => (
    loading || !balancesReady || !address
  ), [loading, balancesReady, address]);

  if (isFullyLoading) {
    return (
      <main className={styles.container}>
        <div className={styles.dashboardWrapper}>
          <motion.div
            className={styles.fullscreenCenter}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            style={{ scale }}
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
      <motion.div
        className={styles.dashboardWrapper}
        style={{ scale }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >

        {/* Top Greeting */}
        <motion.div
          className={styles.greetingWrapper}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className={styles.greeting}>
            Hello, {user?.email?.split("@")[0] ?? "User"}!
          </h2>
          <p className={styles.walletInfo}>
            {truncatedAddress} · {networkLabel}
          </p>
        </motion.div>

        {/* Main Dashboard Row */}
        <div className={styles.dashboardRow}>

          {/* Left Side: Balances */}
          <motion.div
            className={styles.balanceSection}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
          >
            <BalanceCard />
            <div className={styles.footerInfo}>
              Last updated: {updatedAt}
            </div>
          </motion.div>

          {/* Right Side: Live Prices */}
          <motion.div
            className={styles.chartSection}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Suspense fallback={<MiniLoadingSpinner />}>
              <LivePriceTable />
            </Suspense>
          </motion.div>

        </div>

      </motion.div>
    </main>
  );
}

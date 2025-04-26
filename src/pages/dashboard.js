"use client";

import React, { useMemo, Suspense } from "react";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import { FiRefreshCw } from "react-icons/fi";

import { useSystemReady } from "@/hooks/useSystemReady";
import { useAuth } from "@/contexts/AuthContext";
import { useBalance } from "@/contexts/BalanceContext";

import BalanceCard from "@/components/BalanceCard";
import MiniLoadingSpinner from "@/components/MiniLoadingSpinner";
import styles from "@/styles/dashboard.module.css";

// Lazy-load LivePriceTable
const LivePriceTable = dynamic(() => import("@/components/LivePriceTable"), { ssr: false });

export default function Dashboard() {
  const { ready, isMobile } = useSystemReady();
  const { user, wallet } = useAuth();
  const { loading: balLoading, refreshing, refetch, lastUpdated } = useBalance();

  const address = wallet?.wallet?.address ?? "";
  
  const truncatedAddress = useMemo(() => (
    address ? `${address.slice(0, 6)}…${address.slice(-4)}` : ""
  ), [address]);

  const updatedAt = useMemo(() => {
    if (!lastUpdated) return "";
    const d = new Date(lastUpdated);
    return d.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  }, [lastUpdated]);

  // Show loading screen ONLY before ready
  if (!ready || !wallet?.wallet?.address) {
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

  // Final main dashboard rendering
  return (
    <main className={styles.container}>
      <div className={styles.dashboardWrapper}>

        {/* Top Bar */}
        <div className={styles.topBar}>
          <div>
            <h2 className={styles.greeting}>
              Hello, {user?.email?.split("@")[0] ?? "User"}!
            </h2>
            <p className={styles.walletInfo}>
              {truncatedAddress}
            </p>
          </div>
          <button
            className={styles.refreshButton}
            onClick={refetch}
            disabled={balLoading}
            aria-label="Refresh balances"
          >
            <FiRefreshCw className={(balLoading || refreshing) ? styles.spin : undefined} />
          </button>
        </div>

        {/* Main Grid Row */}
        <div className={styles.dashboardRow}>
          
          {/* Live Chart */}
          <motion.div
            className={styles.chartSection}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Suspense fallback={<MiniLoadingSpinner />}>
              <LivePriceTable />
            </Suspense>
          </motion.div>

          {/* Balance Card */}
          <motion.div
            className={styles.balanceSection}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <BalanceCard />

            <div className={styles.footerInfo}>
              {balLoading ? (
                <span className={styles.shimmerSmall} />
              ) : (
                <>Last updated: {updatedAt}</>
              )}
            </div>
          </motion.div>

        </div>

      </div>
    </main>
  );
}

// src/app/dashboard.js
"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";

import { useSystemReady } from "@/hooks/useSystemReady";
import { useAuth }        from "@/contexts/AuthContext";
import { useBalance }     from "@/contexts/BalanceContext";
import networks           from "@/data/networks";

import BalanceCard        from "@/components/BalanceCard";
import MiniLoadingSpinner from "@/components/MiniLoadingSpinner";
import styles             from "@/styles/dashboard.module.css";

const LivePriceTable = dynamic(
  () => import("@/components/LivePriceTable"),
  { ssr: false }
);

export default function Dashboard() {
  const { wallet } = useAuth();
  const { ready, loading: sysLoading, isMobile } = useSystemReady();
  const { getUsdBalance, getEurBalance, loading: balLoading } = useBalance();

  // block only until auth + wallet + balances/prices
  if (sysLoading || !ready || !wallet?.wallet?.address) {
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

  // compute totals across **mainnets** (value from networks[].value)
  const { totalUsd, totalEur } = useMemo(() => {
    const usd = networks.reduce(
      (sum, n) => sum + parseFloat(getUsdBalance(n.value)), 
      0
    );
    const eur = networks.reduce(
      (sum, n) => sum + parseFloat(getEurBalance(n.value)), 
      0
    );
    return { totalUsd: usd, totalEur: eur };
  }, [getUsdBalance, getEurBalance]);

  return (
    <main className={styles.container}>
      <div className={styles.dashboardWrapper}>
        <div className={styles.dashboardRow}>
          {/* Chart ~70% on desktop, full width on mobile */}
          <div className={styles.chartSection}>
            <LivePriceTable />
          </div>

          {/* Balances ~30% on desktop, full width on mobile */}
          <div className={styles.balanceSection}>
            <BalanceCard />
            {/* Totals under the card */}
            <div className={styles.totals}>
              {balLoading ? (
                <span className={styles.shimmerTextSmall} />
              ) : (
                <>Total ≈ ${totalUsd.toFixed(2)} | €{totalEur.toFixed(2)}</>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

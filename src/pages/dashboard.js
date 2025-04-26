// src/app/dashboard.js
"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import { motion } from "framer-motion";

import { useSystemReady } from "@/hooks/useSystemReady";
import { useAuth }        from "@/contexts/AuthContext";
import BalanceCard        from "@/components/BalanceCard";

import styles from "@/styles/dashboard.module.css";
import MiniLoadingSpinner from "@/components/MiniLoadingSpinner";

// defer-load the live price table (no SSR)
const LivePriceTable = dynamic(() => import("@/components/LivePriceTable"), {
  ssr: false,
});

export default function Dashboard() {
  const { wallet } = useAuth();
  const { ready, loading: systemLoading, isMobile } = useSystemReady();

  // only block UI until our core system is up (auth, wallet, balances+prices)
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

  // once ready, render everything–all fetches in BalanceCard happen silently
  return (
    <main className={styles.container}>
      <div className={styles.dashboardWrapper}>
        <div className={styles.dashboardRow}>
          {/* 70% width on desktop, full on mobile */}
          <div className={styles.chartSection}>
            <LivePriceTable />
          </div>

          {/* 30% width on desktop, full on mobile */}
          <div className={styles.balanceSection}>
            <BalanceCard />
          </div>
        </div>
      </div>
    </main>
  );
}

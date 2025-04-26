"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";

import { useSystemReady } from "@/hooks/useSystemReady";
import { useAuth } from "@/contexts/AuthContext";
import { useBalance } from "@/contexts/BalanceContext";
import networks from "@/data/networks";
import { useNetwork } from "@/contexts/NetworkContext";

import styles from "@/styles/dashboard.module.css";
import MiniLoadingSpinner from "@/components/MiniLoadingSpinner";

const LivePriceTable = dynamic(() => import("@/components/LivePriceTable"), {
  ssr: false,
});

export default function Dashboard() {
  const router = useRouter();
  const { wallet } = useAuth();
  const { balances, prices } = useBalance();
  const {
    fallbackBalances,
    fallbackPrices,
    latencyMs,
    sessionScore,
    ready, // 🧠 <- čia svarbiausia
    loading: systemLoading,
    isMobile,
  } = useSystemReady();
  const { activeNetwork } = useNetwork();

  const [showTestnets, setShowTestnets] = useState(false);

  const allBalances = Object.keys(balances || {}).length > 0
    ? balances
    : fallbackBalances || {};

  const allPrices = Object.keys(prices || {}).length > 0
    ? prices
    : fallbackPrices || {};

  const filteredNetworks = useMemo(() => {
    return networks
      .map(n => showTestnets ? n.testnet : n)
      .filter(Boolean);
  }, [showTestnets]);

  return (
    <main className={styles.container}>
      <div className={styles.dashboardWrapper}>
        <LivePriceTable />

        {systemLoading || !ready ? (
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
        ) : (
          <>
            <div className={styles.toggleWrapper}>
              <button
                className={`${styles.toggleButton} ${!showTestnets ? styles.active : ""}`}
                onClick={() => setShowTestnets(false)}
              >
                Mainnets
              </button>
              <button
                className={`${styles.toggleButton} ${showTestnets ? styles.active : ""}`}
                onClick={() => setShowTestnets(true)}
              >
                Testnets
              </button>
            </div>

            <div className={styles.assetList}>
              <AnimatePresence>
                {filteredNetworks.map((net, index) => {
                  const balance = allBalances[net.value] || 0;
                  const price = allPrices?.[net.value];
                  const valueUsd = price ? (balance * price.usd).toFixed(2) : "–";
                  const valueEur = price ? (balance * price.eur).toFixed(2) : "–";

                  return (
                    <motion.div
                      key={net.value}
                      className={styles.assetItem}
                      onClick={() => router.push(`/${net.value}`)}
                      role="button"
                      tabIndex={0}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                      whileHover={{ scale: 1.015 }}
                    >
                      <div className={styles.assetLeft}>
                        <img
                          src={net.icon}
                          alt={net.label}
                          width={40}
                          height={40}
                          className={styles.assetLogo}
                          unoptimized
                        />
                        <div className={styles.assetInfo}>
                          <div className={styles.assetSymbol}>
                            {net.label}
                          </div>
                          <div className={styles.assetName}>
                            {net.value.toUpperCase()}
                          </div>
                        </div>
                      </div>

                      <div className={styles.assetRight}>
                        <div className={styles.assetAmount}>
                          {`${balance.toFixed(6)} ${net.value.toUpperCase()}`}
                        </div>
                        <div className={styles.assetEur}>
                          {valueEur !== "–" ? (
                            <>≈ €{valueEur} | ≈ ${valueUsd}</>
                          ) : (
                            <div className={styles.shimmerTextSmall} />
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </>
        )}
      </div>
    </main>
  );
}

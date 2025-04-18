// src/app/dashboard.js
"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";

import { useSystemReady } from "@/hooks/useSystemReady";
import { useAuth } from "@/contexts/AuthContext";
import { useBalance } from "@/contexts/BalanceContext";
import { useNetwork, SUPPORTED_NETWORKS } from "@/contexts/NetworkContext";

import styles from "@/styles/dashboard.module.css";
import MiniLoadingSpinner from "@/components/MiniLoadingSpinner";

const LivePriceTable = dynamic(() => import("@/components/LivePriceTable"), {
  ssr: false,
});

const iconUrls = {
  eth: "/icons/eth.svg",
  bnb: "/icons/bnb.svg",
  tbnb: "/icons/bnb.svg",
  matic: "/icons/matic.svg",
  avax: "/icons/avax.svg",
};

const names = {
  eth: "Ethereum",
  bnb: "BNB Smart Chain",
  tbnb: "BNB Testnet",
  matic: "Polygon",
  avax: "Avalanche",
};

export default function Dashboard() {
  const router = useRouter();
  const { wallet } = useAuth();
  const { balances, prices } = useBalance();
  const {
    fallbackBalances,
    fallbackPrices,
    latencyMs,
    sessionScore,
    loading: systemLoading,
    isMobile,
  } = useSystemReady();

  const walletReady = !!wallet?.wallet?.address;

  const allBalances =
    Object.keys(balances || {}).length > 0
      ? balances
      : fallbackBalances || {};

  const allPrices =
    Object.keys(prices || {}).length > 0
      ? prices
      : fallbackPrices || {};

  const tokens = useMemo(() => SUPPORTED_NETWORKS, []);

  return (
    <main className={styles.container}>
      <div className={styles.dashboardWrapper}>
        <LivePriceTable />

        {!walletReady || systemLoading ? (
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
          <div className={styles.assetList}>
            <AnimatePresence>
              {tokens.map((network, index) => {
                const balance = allBalances[network] || 0;
                const price = allPrices[network];
                const valueEur = price ? (balance * price.eur).toFixed(2) : "–";
                const valueUsd = price ? (balance * price.usd).toFixed(2) : "–";

                return (
                  <motion.div
                    key={network}
                    className={styles.assetItem}
                    onClick={() => router.push(`/${network}`)}
                    role="button"
                    tabIndex={0}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    whileHover={{ scale: 1.015 }}
                  >
                    <div className={styles.assetLeft}>
                      <Image
                        src={iconUrls[network] || "/icons/default-icon.png"}
                        alt={`${network.toUpperCase()} logo`}
                        width={40}
                        height={40}
                        className={styles.assetLogo}
                        priority
                        unoptimized
                      />
                      <div className={styles.assetInfo}>
                        <div className={styles.assetSymbol}>
                          {network.toUpperCase()}
                        </div>
                        <div className={styles.assetName}>
                          {names[network] || "Unknown"}
                        </div>
                      </div>
                    </div>

                    <div className={styles.assetRight}>
                      <div className={styles.assetAmount}>
                        {`${balance.toFixed(6)} ${network.toUpperCase()}`}
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
        )}
      </div>
    </main>
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";

import { useSystemReady } from "@/hooks/useSystemReady";
import { useAuth } from "@/contexts/AuthContext";
import { useBalance } from "@/contexts/BalanceContext";
import { useNetwork } from "@/contexts/NetworkContext";

import styles from "@/styles/dashboard.module.css";

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
  const { fallbackBalances, fallbackPrices, latencyMs, sessionScore } = useSystemReady();
  const walletReady = !!wallet?.wallet?.address;

  // ✅ Prioritetas: live > fallback > empty
  const allBalances = balances && Object.keys(balances).length > 0
    ? balances
    : fallbackBalances || {};

  const allPrices = prices && Object.keys(prices).length > 0
    ? prices
    : fallbackPrices || {};

  const tokens = useMemo(() => Object.keys(allBalances), [allBalances]);

  return (
    <main className={styles.container}>
      <div className={styles.dashboardWrapper}>
        <LivePriceTable />

        {!walletReady ? (
          <div className={styles.fullscreenCenter}>
            <div className={styles.shimmerCard} />
            <p className={styles.loadingText}>Loading wallet...</p>
            <p className={styles.loadingSub}>
              Session Score: {sessionScore}% | Latency: {latencyMs}ms
            </p>
          </div>
        ) : (
          <div className={styles.assetList}>
            <AnimatePresence>
              {tokens.length === 0 ? (
                <motion.div
                  className={styles.noAssets}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  No assets found.
                </motion.div>
              ) : (
                tokens.map((network, index) => {
                  const balance = allBalances[network];
                  const price = allPrices[network];
                  const valueEur = price && balance ? (balance * price.eur).toFixed(2) : "–";
                  const valueUsd = price && balance ? (balance * price.usd).toFixed(2) : "–";

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
                          {balance != null ? (
                            `${balance.toFixed(6)} ${network.toUpperCase()}`
                          ) : (
                            <div className={styles.shimmerText} />
                          )}
                        </div>
                        <div className={styles.assetEur}>
                          {valueEur !== "–" ? (
                            `≈ €${valueEur} | ≈ $${valueUsd}`
                          ) : (
                            <div className={styles.shimmerTextSmall} />
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    </main>
  );
}

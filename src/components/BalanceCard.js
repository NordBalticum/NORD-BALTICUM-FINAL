"use client";

import React, { useState, useMemo } from "react";
import Image from "next/image";
import { useBalance } from "@/contexts/BalanceContext";
import networks from "@/data/networks";
import styles from "./balancecard.module.css";

export default function BalanceCard() {
  const { balances, prices, balancesReady, lastUpdated } = useBalance();
  const [showTestnets, setShowTestnets] = useState(false);

  const now = Date.now();

  const networkList = useMemo(() =>
    networks.filter(net => showTestnets ? net.isTestnet : !net.isTestnet),
    [showTestnets]
  );

  const fmtCrypto = (n) =>
    Number(n || 0).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 6,
    });

  const fmtFiat = (n) =>
    Number(n || 0).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  const { totalUsd, totalEur } = useMemo(() => {
    return networkList.reduce((acc, net) => {
      const bal = balances[net.key] ?? 0;
      const price = prices[net.key] ?? { usd: 0, eur: 0 };
      acc.totalUsd += bal * price.usd;
      acc.totalEur += bal * price.eur;
      return acc;
    }, { totalUsd: 0, totalEur: 0 });
  }, [networkList, balances, prices]);

  if (!balancesReady) {
    return (
      <div className={styles.cardWrapper}>
        <div className={styles.loadingState}>
          Fetching balances...
        </div>
      </div>
    );
  }

  return (
    <div className={styles.cardWrapper}>
      <div className={styles.toggleWrapper} role="tablist" aria-label="Balance view toggle">
        <button
          role="tab"
          aria-selected={!showTestnets}
          tabIndex={0}
          onClick={() => setShowTestnets(false)}
          className={`${styles.toggleButton} ${!showTestnets ? styles.active : ""}`}
        >
          Mainnets
        </button>
        <button
          role="tab"
          aria-selected={showTestnets}
          tabIndex={0}
          onClick={() => setShowTestnets(true)}
          className={`${styles.toggleButton} ${showTestnets ? styles.active : ""}`}
        >
          Testnets
        </button>
      </div>

      <div className={styles.list} aria-live="polite">
        {networkList.map(net => {
          const balance = balances[net.key] ?? 0;
          const price = prices[net.key] ?? { usd: 0, eur: 0 };
          const usd = balance * price.usd;
          const eur = balance * price.eur;
          const hasPrice = price.usd > 0 || price.eur > 0;

          return (
            <div key={net.key} className={styles.listItem}>
              <div className={styles.networkLeft}>
                <Image
                  src={net.icon}
                  alt={net.label}
                  width={32}
                  height={32}
                  unoptimized
                />
                <span className={styles.networkLabel}>{net.label}</span>
              </div>
              <div className={styles.networkRight}>
                <div className={styles.cryptoAmount}>
                  {fmtCrypto(balance)}
                </div>
                <div className={styles.fiatAmount}>
                  {hasPrice ? (
                    <>≈ ${fmtFiat(usd)} | €{fmtFiat(eur)}</>
                  ) : "–"}
                </div>
              </div>
            </div>
          );
        })}

        <div className={`${styles.listItem} ${styles.totalRow}`}>
          <div className={styles.networkLeft}>
            <span className={styles.networkLabel}>Total</span>
          </div>
          <div className={styles.networkRight}>
            <div className={styles.cryptoAmount}></div>
            <div className={styles.fiatAmount}>
              {(totalUsd || totalEur) ? (
                <span style={{
                  background: "linear-gradient(90deg, #ffd700, #ff9900)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  fontWeight: 700
                }}>
                  ≈ ${fmtFiat(totalUsd)} | €{fmtFiat(totalEur)}
                </span>
              ) : "–"}
            </div>
          </div>
        </div>

        {lastUpdated && (
          <div className={styles.updatedAgo}>
            Updated {Math.floor((now - lastUpdated) / 1000)}s ago
          </div>
        )}
      </div>
    </div>
  );
}

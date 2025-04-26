"use client";

import React, { useState, useMemo } from "react";
import Image from "next/image";
import { useBalance } from "@/contexts/BalanceContext";
import fallbackRPCs from "@/utils/fallbackRPCs"; // ✅ NAUJAS – fallbackRPCs.js
import styles from "./balancecard.module.css";

export default function BalanceCard() {
  const { balances, prices, balancesReady } = useBalance();
  const [showTestnets, setShowTestnets] = useState(false);

  const networkList = useMemo(() => {
    return Object.values(fallbackRPCs)
      .filter(net => {
        if (showTestnets) return net.isTestnet;
        return !net.isTestnet;
      });
  }, [showTestnets]);

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
      acc.totalUsd += bal * (price.usd || 0);
      acc.totalEur += bal * (price.eur || 0);
      return acc;
    }, { totalUsd: 0, totalEur: 0 });
  }, [networkList, balances, prices]);

  if (!balancesReady) {
    return (
      <div className={styles.cardWrapper}>
        <div className={styles.loadingState}>Loading balances...</div>
      </div>
    );
  }

  return (
    <div className={styles.cardWrapper}>

      {/* Toggle */}
      <div className={styles.toggleWrapper} role="tablist">
        <button
          role="tab"
          aria-selected={!showTestnets}
          onClick={() => setShowTestnets(false)}
          className={`${styles.toggleButton} ${!showTestnets ? styles.active : ""}`}
        >
          Mainnets
        </button>
        <button
          role="tab"
          aria-selected={showTestnets}
          onClick={() => setShowTestnets(true)}
          className={`${styles.toggleButton} ${showTestnets ? styles.active : ""}`}
        >
          Testnets
        </button>
      </div>

      {/* List */}
      <div className={styles.list}>
        {networkList.map((net) => {
          const balance = balances[net.key] ?? 0;
          const price = prices[net.key] ?? { usd: 0, eur: 0 };
          const usd = balance * (price.usd || 0);
          const eur = balance * (price.eur || 0);
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
                  ) : (
                    <>–</>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {/* TOTAL */}
        <div className={`${styles.listItem} ${styles.totalRow}`}>
          <div className={styles.networkLeft}>
            <span className={styles.networkLabel}>Total</span>
          </div>
          <div className={styles.networkRight}>
            <div className={styles.cryptoAmount}></div>
            <div className={styles.fiatAmount}>
              {(totalUsd || totalEur) ? (
                <>≈ ${fmtFiat(totalUsd)} | €{fmtFiat(totalEur)}</>
              ) : (
                <>–</>
              )}
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}

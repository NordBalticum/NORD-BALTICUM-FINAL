"use client";

import React, { useState, useMemo } from "react";
import Image from "next/image";
import { useBalance } from "@/contexts/BalanceContext";
import networks from "@/data/networks";
import styles from "./balancecard.module.css";

export default function BalanceCard() {
  const { balances, prices, balancesReady } = useBalance();
  const [showTestnets, setShowTestnets] = useState(false);

  const availableNetworks = useMemo(() => {
    return networks
      .map((net) => (showTestnets && net.testnet ? net.testnet : net))
      .filter(Boolean);
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
    return availableNetworks.reduce(
      (acc, net) => {
        const balance = balances[net.value] ?? 0;
        const price = prices[net.value] ?? { usd: 0, eur: 0 };
        acc.totalUsd += balance * (price.usd || 0);
        acc.totalEur += balance * (price.eur || 0);
        return acc;
      },
      { totalUsd: 0, totalEur: 0 }
    );
  }, [availableNetworks, balances, prices]);

  if (!balancesReady) {
    return (
      <div className={styles.cardWrapper}>
        <div className={styles.loadingState}>
          Loading balances...
        </div>
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

      {/* Balance List */}
      <div className={styles.list}>
        {availableNetworks.map((net) => {
          const balance = balances[net.value] ?? 0;
          const price = prices[net.value] ?? { usd: 0, eur: 0 };
          const usd = balance * (price.usd || 0);
          const eur = balance * (price.eur || 0);
          const hasPrice = price.usd > 0 || price.eur > 0;

          return (
            <div key={net.value} className={styles.listItem}>
              <div className={styles.networkInfo}>
                <Image
                  src={net.icon}
                  alt={net.label}
                  width={32}
                  height={32}
                  unoptimized
                />
                <span className={styles.networkLabel}>{net.label}</span>
              </div>

              <div className={styles.amountInfo}>
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
          <div className={styles.networkInfo}>
            <span className={styles.networkLabel}>Total</span>
          </div>
          <div className={styles.amountInfo}>
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

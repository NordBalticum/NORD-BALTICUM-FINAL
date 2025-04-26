"use client";

import React, { useState, useMemo } from "react";
import Image from "next/image";
import { useBalance } from "@/contexts/BalanceContext";
import networks from "@/data/networks";
import styles from "./balancecard.module.css";

export default function BalanceCard() {
  const { balances, prices, loading, refreshing } = useBalance();
  const [showTestnets, setShowTestnets] = useState(false);

  // Renkam tinklelius pagal Mainnet/Testnet
  const items = useMemo(() => {
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

  // Skaičiuojam TOTAL sumas
  const { totalUsd, totalEur } = useMemo(() => {
    let totalUsd = 0;
    let totalEur = 0;
    for (const net of items) {
      const bal = balances[net.value] ?? 0;
      const price = prices[net.value] ?? { usd: 0, eur: 0 };
      totalUsd += bal * (price.usd || 0);
      totalEur += bal * (price.eur || 0);
    }
    return { totalUsd, totalEur };
  }, [items, balances, prices]);

  const isLoadingBalances = loading || refreshing; // 🔥 atskirtas tikras loading

  return (
    <div className={styles.cardWrapper}>

      {/* Tinklelio pasirinkimas */}
      <div role="tablist" className={styles.toggleWrapper}>
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

      {/* Balansų sąrašas */}
      <div className={styles.list}>
        {items.map((net) => {
          const balance = balances[net.value] ?? 0;
          const price = prices[net.value] ?? { usd: 0, eur: 0 };
          const usd = balance * (price.usd || 0);
          const eur = balance * (price.eur || 0);
          const hasPrice = price.usd || price.eur;

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
                  {isLoadingBalances && !hasPrice ? (
                    <span className={styles.shimmerSmall} />
                  ) : (
                    <>≈ ${fmtFiat(usd)} | €{fmtFiat(eur)}</>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {/* Total suma */}
        <div className={`${styles.listItem} ${styles.totalRow}`}>
          <div className={styles.networkInfo}>
            <span className={styles.networkLabel}>Total</span>
          </div>
          <div className={styles.amountInfo}>
            <div className={styles.cryptoAmount}></div>
            <div className={styles.fiatAmount}>
              {isLoadingBalances ? (
                <span className={styles.shimmerSmall} />
              ) : (
                <>≈ ${fmtFiat(totalUsd)} | €{fmtFiat(totalEur)}</>
              )}
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}

"use client";

import React, { useState, useMemo } from "react";
import Image from "next/image";
import { useBalance } from "@/contexts/BalanceContext";
import networks from "@/data/networks";
import styles from "./balancecard.module.css";

export default function BalanceCard() {
  const { balances, prices, loading } = useBalance(); // Tik balances + prices
  const [showTestnets, setShowTestnets] = useState(false);

  // Filtruojam tinklus
  const items = useMemo(() => {
    return networks
      .map((net) => (showTestnets && net.testnet ? net.testnet : net))
      .filter(Boolean);
  }, [showTestnets]);

  // Skaičių formatteriai
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

  // Skaičiuojam total iš balances + prices
  const { totalUsd, totalEur } = useMemo(() => {
    return items.reduce(
      (acc, net) => {
        const bal = balances[net.value] ?? 0;
        const price = prices[net.value] ?? { usd: 0, eur: 0 };
        acc.totalUsd += bal * (price.usd || 0);
        acc.totalEur += bal * (price.eur || 0);
        return acc;
      },
      { totalUsd: 0, totalEur: 0 }
    );
  }, [items, balances, prices]);

  return (
    <div className={styles.cardWrapper}>
      
      {/* Toggle */}
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

      {/* List */}
      <div className={styles.list}>
        {items.map((net) => {
          const balance = balances[net.value] ?? 0;
          const price = prices[net.value] ?? { usd: 0, eur: 0 };
          const usd = balance * (price.usd || 0);
          const eur = balance * (price.eur || 0);

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
                  {(usd || eur) ? (
                    <>≈ ${fmtFiat(usd)} | €{fmtFiat(eur)}</>
                  ) : (
                    <span className={styles.shimmerSmall} />
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {/* Total Row */}
        <div className={`${styles.listItem} ${styles.totalRow}`}>
          <div className={styles.networkInfo}>
            <span className={styles.networkLabel}>Total</span>
          </div>
          <div className={styles.amountInfo}>
            <div className={styles.cryptoAmount} />
            <div className={styles.fiatAmount}>
              {(totalUsd || totalEur) ? (
                <>≈ ${fmtFiat(totalUsd)} | €{fmtFiat(totalEur)}</>
              ) : (
                <span className={styles.shimmerSmall} />
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

"use client";

import React, { useState, useMemo } from "react";
import Image from "next/image";
import { useBalance } from "@/contexts/BalanceContext";
import networks from "@/data/networks";
import styles from "./balancecard.module.css";

export default function BalanceCard() {
  const { balances, loading, getUsdBalance, getEurBalance } = useBalance();
  const [showTestnets, setShowTestnets] = useState(false);

  const items = useMemo(() => {
    return networks
      .map((net) => (showTestnets && net.testnet ? net.testnet : net))
      .filter(Boolean);
  }, [showTestnets]);

  const fmtCrypto = (n) => Number(n || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 6,
  });

  const fmtFiat = (n) => Number(n || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const { totalUsd, totalEur } = useMemo(() => {
    return items.reduce(
      (acc, net) => {
        acc.totalUsd += Number(getUsdBalance(net.value)) || 0;
        acc.totalEur += Number(getEurBalance(net.value)) || 0;
        return acc;
      },
      { totalUsd: 0, totalEur: 0 }
    );
  }, [items, getUsdBalance, getEurBalance]);

  return (
    <div className={styles.cardWrapper}>
      
      {/* Toggle: Mainnets / Testnets */}
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

      {/* Balances List */}
      <div className={styles.list}>
        {items.map((net) => {
          const balance = balances[net.value] ?? 0;
          const usd = Number(getUsdBalance(net.value)) || 0;
          const eur = Number(getEurBalance(net.value)) || 0;

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
                  {loading ? (
                    <span className={styles.shimmerSmall} />
                  ) : (usd || eur) ? (
                    <>≈ ${fmtFiat(usd)} | €{fmtFiat(eur)}</>
                  ) : (
                    <>–</>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {/* TOTAL Row */}
        <div className={`${styles.listItem} ${styles.totalRow}`}>
          <div className={styles.networkInfo}>
            <span className={styles.networkLabel}>Total</span>
          </div>
          <div className={styles.amountInfo}>
            <div className={styles.cryptoAmount}></div>
            <div className={styles.fiatAmount}>
              {loading ? (
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

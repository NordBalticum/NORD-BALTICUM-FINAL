"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import { useBalance } from "@/contexts/BalanceContext";
import networks from "@/data/networks";
import styles from "./balancecard.module.css";

export default function BalanceCard() {
  const {
    balances,
    loading: isLoading,
    getUsdBalance,
    getEurBalance,
  } = useBalance();

  const [showTestnets, setShowTestnets] = useState(false);

  // build the list of networks to show
  const items = useMemo(
    () =>
      networks
        .map((n) => (showTestnets && n.testnet ? n.testnet : n))
        .filter(Boolean),
    [showTestnets]
  );

  // formatting helpers
  const formatCrypto = (n) =>
    Number(n).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 6,
    });
  const formatFiat = (n) =>
    Number(n).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  // compute totals
  const { totalUsd, totalEur } = useMemo(() => {
    const usd = items.reduce(
      (sum, net) => sum + parseFloat(getUsdBalance(net.value)),
      0
    );
    const eur = items.reduce(
      (sum, net) => sum + parseFloat(getEurBalance(net.value)),
      0
    );
    return { totalUsd: usd, totalEur: eur };
  }, [items, getUsdBalance, getEurBalance]);

  return (
    <div className={styles.cardWrapper}>
      {/* Mainnet / Testnet toggle */}
      <div role="tablist" className={styles.toggleWrapper}>
        <button
          role="tab"
          aria-selected={!showTestnets}
          onClick={() => setShowTestnets(false)}
          className={`${styles.toggleButton} ${
            !showTestnets ? styles.active : ""
          }`}
        >
          Mainnets
        </button>
        <button
          role="tab"
          aria-selected={showTestnets}
          onClick={() => setShowTestnets(true)}
          className={`${styles.toggleButton} ${
            showTestnets ? styles.active : ""
          }`}
        >
          Testnets
        </button>
      </div>

      {/* Asset list */}
      <div className={styles.list}>
        {items.map((net) => {
          const bal = balances[net.value] ?? 0;
          const usd = getUsdBalance(net.value);
          const eur = getEurBalance(net.value);

          return (
            <div key={net.value} className={styles.listItem}>
              <div className={styles.networkInfo}>
                <Image
                  src={net.icon}
                  alt={`${net.label} icon`}
                  width={32}
                  height={32}
                  unoptimized
                />
                <span className={styles.networkLabel}>{net.label}</span>
              </div>

              <div className={styles.amountInfo}>
                {/* Crypto balance */}
                <div className={styles.cryptoAmount}>
                  {formatCrypto(bal)}
                </div>

                {/* Fiat value or shimmer */}
                <div className={styles.fiatAmount}>
                  {isLoading ? (
                    <span className={styles.shimmerTextSmall} />
                  ) : Number(usd) || Number(eur) ? (
                    <>≈ ${formatFiat(usd)} | €{formatFiat(eur)}</>
                  ) : (
                    <>–</>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {/* Total row */}
        <div className={`${styles.listItem} ${styles.totalRow}`}>
          <div className={styles.networkInfo}>
            <span className={styles.networkLabel}>Total</span>
          </div>
          <div className={styles.amountInfo}>
            <div className={styles.cryptoAmount}> </div>
            <div className={styles.fiatAmount}>
              {isLoading ? (
                <span className={styles.shimmerTextSmall} />
              ) : (
                <>≈ ${formatFiat(totalUsd)} | €{formatFiat(totalEur)}</>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

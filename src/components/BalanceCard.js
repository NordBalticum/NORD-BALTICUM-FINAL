"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import { useBalance } from "@/contexts/BalanceContext";
import networks from "@/data/networks";
import styles from "./balancecard.module.css";

export default function BalanceCard() {
  const { balances, loading, getUsdBalance, getEurBalance } = useBalance();
  const [showTestnets, setShowTestnets] = useState(false);

  // pick either mainnet or testnets
  const items = useMemo(
    () =>
      networks
        .map(n => (showTestnets && n.testnet ? n.testnet : n))
        .filter(Boolean),
    [showTestnets]
  );

  // formaters
  const fmtCrypto = n =>
    Number(n).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 6,
    });
  const fmtFiat = n =>
    Number(n).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  // totals
  const { totalUsd, totalEur } = useMemo(() => {
    const u = items.reduce((sum, net) => sum + parseFloat(getUsdBalance(net.value)), 0);
    const e = items.reduce((sum, net) => sum + parseFloat(getEurBalance(net.value)), 0);
    return { totalUsd: u, totalEur: e };
  }, [items, getUsdBalance, getEurBalance]);

  return (
    <div className={styles.cardWrapper}>
      {/* tabs */}
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

      {/* list */}
      <div className={styles.list}>
        {items.map(net => {
          const bal = balances[net.value] ?? 0;
          const usd = getUsdBalance(net.value);
          const eur = getEurBalance(net.value);
          return (
            <div key={net.value} className={styles.listItem}>
              <div className={styles.networkInfo}>
                <Image src={net.icon} alt={net.label} width={32} height={32} unoptimized />
                <span className={styles.networkLabel}>{net.label}</span>
              </div>
              <div className={styles.amountInfo}>
                <div className={styles.cryptoAmount}>{fmtCrypto(bal)}</div>
                <div className={styles.fiatAmount}>
                  {loading ? (
                    <span className={styles.shimmerTextSmall} />
                  ) : (Number(usd) || Number(eur)) ? (
                    <>≈ ${fmtFiat(usd)} | €{fmtFiat(eur)}</>
                  ) : (
                    <>–</>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {/* total row */}
        <div className={`${styles.listItem} ${styles.totalRow}`}>
          <div className={styles.networkInfo}>
            <span className={styles.networkLabel}>Total</span>
          </div>
          <div className={styles.amountInfo}>
            <div className={styles.cryptoAmount} />
            <div className={styles.fiatAmount}>
              {loading ? (
                <span className={styles.shimmerTextSmall} />
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

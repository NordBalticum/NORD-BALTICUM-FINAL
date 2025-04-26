// src/components/BalanceCard.js
"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import { useBalance } from "@/contexts/BalanceContext";
import networks from "@/data/networks";
import styles from "./balancecard.module.css";

export default function BalanceCard() {
  const {
    balances,
    loading: balancesLoading,
    getUsdBalance,
    getEurBalance,
  } = useBalance();

  const [showTestnets, setShowTestnets] = useState(false);

  const items = useMemo(
    () =>
      networks
        .map(n => (showTestnets && n.testnet ? n.testnet : n))
        .filter(Boolean),
    [showTestnets]
  );

  return (
    <div className={styles.cardWrapper}>
      <div className={styles.toggleWrapper}>
        <button
          className={`${styles.toggleButton} ${!showTestnets && styles.active}`}
          onClick={() => setShowTestnets(false)}
        >
          Mainnets
        </button>
        <button
          className={`${styles.toggleButton} ${showTestnets && styles.active}`}
          onClick={() => setShowTestnets(true)}
        >
          Testnets
        </button>
      </div>

      <div className={styles.list}>
        {items.map(net => {
          const bal = balances[net.value] ?? 0;
          const usd = getUsdBalance(net.value);
          const eur = getEurBalance(net.value);
          const showFiat = !balancesLoading && (Number(usd) || Number(eur));

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
                  {bal.toFixed(6)}
                </div>
                <div className={styles.fiatAmount}>
                  {balancesLoading ? (
                    <span className={styles.shimmerTextSmall} />
                  ) : showFiat ? (
                    <>≈ ${usd} | €{eur}</>
                  ) : (
                    <>–</>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

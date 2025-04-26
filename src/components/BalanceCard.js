// src/components/BalanceCard.js
"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import { useBalance } from "@/contexts/BalanceContext";
import networks from "@/data/networks";
import styles from "./BalanceCard.module.css";

export default function BalanceCard() {
  const {
    balances,
    loading: balancesLoading,
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

  return (
    <div className={styles.cardWrapper}>
      {/* Mainnet / Testnet toggle */}
      <div className={styles.toggleWrapper}>
        <button
          className={`${styles.toggleButton} ${
            !showTestnets ? styles.active : ""
          }`}
          onClick={() => setShowTestnets(false)}
        >
          Mainnets
        </button>
        <button
          className={`${styles.toggleButton} ${
            showTestnets ? styles.active : ""
          }`}
          onClick={() => setShowTestnets(true)}
        >
          Testnets
        </button>
      </div>

      {/* Always show the list—prices load in background */}
      <div className={styles.list}>
        {items.map((net) => {
          const bal = balances[net.value] ?? 0;
          // use helpers that know about TTL and caching:
          const usdValue = getUsdBalance(net.value);
          const eurValue = getEurBalance(net.value);

          const showFiat =
            !balancesLoading && (Number(usdValue) || Number(eurValue));

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
                    <>≈ ${usdValue} | €{eurValue}</>
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

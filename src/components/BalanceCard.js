// src/components/BalanceCard.js
"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import { useBalance } from "@/contexts/BalanceContext";
import networks from "@/data/networks";
import styles from "./balancecard.module.css";

export default function BalanceCard() {
  const { balances, prices } = useBalance();
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

      {/* Always show the list—no loading spinner */}
      <div className={styles.list}>
        {items.map((net) => {
          const bal = balances[net.value] ?? 0;
          const usd = prices[net.value]?.usd ?? 0;
          const eur = prices[net.value]?.eur ?? 0;
          const usdValue = (bal * usd).toFixed(2);
          const eurValue = (bal * eur).toFixed(2);

          return (
            <div key={net.value} className={styles.listItem}>
              <div className={styles.networkInfo}>
                <Image
                  src={net.icon}
                  alt={net.label}
                  width={24}
                  height={24}
                  unoptimized
                />
                <span className={styles.networkLabel}>{net.label}</span>
              </div>
              <div className={styles.amountInfo}>
                <span className={styles.cryptoAmount}>
                  {bal.toFixed(6)}
                </span>
                <span className={styles.fiatAmount}>
                  ≈ ${usdValue} | €{eurValue}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

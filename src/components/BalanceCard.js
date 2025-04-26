"use client";

import { useState } from "react";
import { useBalance } from "@/contexts/BalanceContext";
import networks from "@/data/networks";
import styles from "@/styles/balancecard.module.css";

export default function BalanceCard() {
  const { balances, prices, loading } = useBalance();
  const [showTestnets, setShowTestnets] = useState(false);

  const filteredNetworks = networks
    .map(n => (showTestnets ? n.testnet : n))
    .filter(Boolean);

  return (
    <div className={styles.cardWrapper}>
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

      {loading ? (
        <div className={styles.loading}>Loading balances...</div>
      ) : (
        <div className={styles.list}>
          {filteredNetworks.map(net => {
            const balance = balances?.[net.value] ?? 0;
            const usd = prices?.[net.value]?.usd ?? 0;
            const eur = prices?.[net.value]?.eur ?? 0;
            const usdValue = (balance * usd).toFixed(2);
            const eurValue = (balance * eur).toFixed(2);

            return (
              <div key={net.value} className={styles.listItem}>
                <div className={styles.networkInfo}>
                  <img
                    src={net.icon}
                    alt={net.label}
                    className={styles.networkIcon}
                  />
                  <span className={styles.networkLabel}>{net.label}</span>
                </div>
                <div className={styles.amountInfo}>
                  <div className={styles.cryptoAmount}>
                    {balance.toFixed(6)}
                  </div>
                  <div className={styles.fiatAmount}>
                    ≈ ${usdValue} | €{eurValue}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

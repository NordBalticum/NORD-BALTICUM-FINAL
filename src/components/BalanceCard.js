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
    loading: isLoading,
    getUsdBalance,
    getEurBalance,
  } = useBalance();

  const [showTestnets, setShowTestnets] = useState(false);

  // build once per toggle change
  const items = useMemo(
    () =>
      networks
        .map((n) => (showTestnets && n.testnet ? n.testnet : n))
        .filter(Boolean),
    [showTestnets]
  );

  // helper to format numbers nicely
  const formatCrypto = (n) =>
    Number(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 });
  const formatFiat = (s) =>
    Number(s).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div className={styles.cardWrapper}>
      {/* Mainnet / Testnet toggle */}
      <div className={styles.toggleWrapper}>
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

      {/* Always render list; prices & balances load silently */}
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
                  alt={net.label}
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

                {/* Fiat loading vs values */}
                <div className={styles.fiatAmount}>
                  {isLoading ? (
                    <span className={styles.shimmerTextSmall} />
                  ) : (
                    // if both zero, show “–”
                    (Number(usd) || Number(eur)) ? (
                      <>≈ ${formatFiat(usd)} | €{formatFiat(eur)}</>
                    ) : (
                      <>–</>
                    )
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

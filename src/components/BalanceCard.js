// src/components/BalanceCard.tsx
"use client";

import React, { useState, useMemo, memo } from "react";
import Image from "next/image";
import { useBalance } from "@/contexts/BalanceContext";
import networks, { NetworkConfig } from "@/data/networks";
import styles from "./balancecard.module.css";

interface BalanceListItemProps {
  network: NetworkConfig;
  balance: number;
  usd: number;
  eur: number;
  loading: boolean;
}

const BalanceListItem = memo<BalanceListItemProps>(({
  network,
  balance,
  usd,
  eur,
  loading,
}) => {
  const fmtCrypto = useMemo(
    () =>
      new Intl.NumberFormat(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 6,
      }).format,
    []
  );
  const fmtFiat = useMemo(
    () =>
      new Intl.NumberFormat(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format,
    []
  );

  const hasFiat = !loading && (usd > 0 || eur > 0);

  return (
    <div className={styles.listItem} role="row">
      <div className={styles.networkInfo} role="cell">
        <Image
          src={network.icon}
          alt={network.label}
          width={32}
          height={32}
          unoptimized
        />
        <span className={styles.networkLabel}>{network.label}</span>
      </div>
      <div className={styles.amountInfo} role="cell">
        <div className={styles.cryptoAmount}>
          {fmtCrypto(balance)}
        </div>
        <div className={styles.fiatAmount}>
          {loading
            ? <span className={styles.shimmerSmall} aria-hidden="true" />
            : hasFiat
              ? <>≈ ${fmtFiat(usd)} | €{fmtFiat(eur)}</>
              : <span aria-label="no balance">&ndash;</span>}
        </div>
      </div>
    </div>
  );
});
BalanceListItem.displayName = "BalanceListItem";

export default function BalanceCard() {
  const { balances, loading, getUsdBalance, getEurBalance } = useBalance();
  const [showTestnets, setShowTestnets] = useState(false);

  // choose mainnet vs testnet
  const items = useMemo(
    () =>
      networks
        .map(net =>
          showTestnets && net.testnet
            ? { ...net.testnet, label: `${net.label} (test)` }
            : net
        ),
    [showTestnets]
  );

  // totals
  const { totalUsd, totalEur } = useMemo(() => {
    const u = items.reduce(
      (sum, net) => sum + Number(getUsdBalance(net.value)),
      0
    );
    const e = items.reduce(
      (sum, net) => sum + Number(getEurBalance(net.value)),
      0
    );
    return { totalUsd: u, totalEur: e };
  }, [items, getUsdBalance, getEurBalance]);

  // formatters for total
  const fmtTotal = useMemo(
    () =>
      new Intl.NumberFormat(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format,
    []
  );

  return (
    <div className={styles.cardWrapper}>
      <div role="tablist" className={styles.toggleWrapper}>
        {["Mainnets", "Testnets"].map((label, idx) => (
          <button
            key={label}
            role="tab"
            aria-selected={idx === Number(showTestnets)}
            onClick={() => setShowTestnets(idx === 1)}
            className={`${styles.toggleButton} ${
              idx === Number(showTestnets) ? styles.active : ""
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className={styles.list} role="table" aria-label="Balances">
        {items.map(net => {
          const bal = balances[net.value] ?? 0;
          const usd = Number(getUsdBalance(net.value));
          const eur = Number(getEurBalance(net.value));
          return (
            <BalanceListItem
              key={net.value}
              network={net}
              balance={bal}
              usd={usd}
              eur={eur}
              loading={loading}
            />
          );
        })}

        <div
          className={`${styles.listItem} ${styles.totalRow}`}
          role="row"
        >
          <div className={styles.networkInfo} role="cell">
            <span className={styles.networkLabel}>Total</span>
          </div>
          <div className={styles.amountInfo} role="cell">
            <div className={styles.cryptoAmount} aria-hidden="true" />
            <div className={styles.fiatAmount}>
              {loading
                ? <span className={styles.shimmerSmall} aria-hidden="true" />
                : <>≈ ${fmtTotal(totalUsd)} | €{fmtTotal(totalEur)}</>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

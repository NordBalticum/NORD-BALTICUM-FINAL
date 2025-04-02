"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

import { useMagicLink } from "@/contexts/MagicLinkContext";
import { useWalletCheck } from "@/contexts/WalletCheckContext";
import { useBalance } from "@/hooks/useBalance";

import StarsBackground from "@/components/StarsBackground";
import background from "@/styles/background.module.css";
import styles from "@/styles/dashboard.module.css";

const networksData = [
  {
    name: "BNB Smart Chain",
    symbol: "bsc",
    route: "/bnb",
    logo: "https://cryptologos.cc/logos/bnb-bnb-logo.png",
  },
  {
    name: "BSC Testnet",
    symbol: "tbnb",
    route: "/tbnb",
    logo: "https://cryptologos.cc/logos/binance-coin-bnb-logo.png",
  },
  {
    name: "Ethereum",
    symbol: "ethereum",
    route: "/eth",
    logo: "https://cryptologos.cc/logos/ethereum-eth-logo.png",
  },
  {
    name: "Polygon",
    symbol: "polygon",
    route: "/matic",
    logo: "https://cryptologos.cc/logos/polygon-matic-logo.png",
  },
  {
    name: "Avalanche",
    symbol: "avalanche",
    route: "/avax",
    logo: "https://cryptologos.cc/logos/avalanche-avax-logo.png",
  },
];

export default function Dashboard() {
  const router = useRouter();
  const { user } = useMagicLink();
  const { walletReady } = useWalletCheck();
  const { balances, isLoading } = useBalance();

  const networks = useMemo(() => networksData, []);
  const total = balances?.totalEUR || "0.00";

  // Saugus nukreipimas jeigu vartotojas neprisijungęs
  useEffect(() => {
    if (!user || !walletReady) {
      router.replace("/");
    }
  }, [user, walletReady, router]);

  // Kraunasi kol dar nėra pasiruošta
  if (!user || !walletReady || isLoading) {
    return <div className={styles.loading}>Loading Wallet...</div>;
  }

  return (
    <main className={`${styles.container} ${background.gradient}`}>
      <StarsBackground />

      <div className={styles.globalWrapper}>
        <div className={styles.header}>
          <Image
            src="/icons/logo.svg"
            alt="NordBalticum"
            width={160}
            height={60}
            className={styles.logo}
            priority
          />
        </div>

        <div className={styles.totalBox}>
          <p className={styles.totalLabel}>Total Wallet Value</p>
          <h2 className={styles.totalValue}>€ {total}</h2>
        </div>

        <div className={styles.assetGrid}>
          {networks.map((net) => {
            const netBalance = balances[net.symbol] || {
              amount: "0.00000",
              eur: "0.00",
            };

            return (
              <div
                key={net.symbol}
                className={styles.assetCard}
                onClick={() => router.push(net.route)}
              >
                <div className={styles.assetLeft}>
                  <Image
                    src={net.logo}
                    alt={`${net.symbol} logo`}
                    width={42}
                    height={42}
                    className={styles.assetLogo}
                    unoptimized
                  />
                  <div className={styles.assetInfo}>
                    <span className={styles.assetSymbol}>
                      {net.symbol.toUpperCase()}
                    </span>
                    <span className={styles.assetName}>{net.name}</span>
                  </div>
                </div>

                <div className={styles.assetRight}>
                  <span className={styles.assetAmount}>
                    {netBalance.amount} {net.symbol.toUpperCase()}
                  </span>
                  <span className={styles.assetEur}>€ {netBalance.eur}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}

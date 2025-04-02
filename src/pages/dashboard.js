"use client";

import React, { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

import { useSystem } from "@/contexts/SystemContext";
import StarsBackground from "@/components/StarsBackground";

import styles from "@/styles/dashboard.module.css";
import background from "@/styles/background.module.css";

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
  const { user, wallet, loading, balance } = useSystem();

  const networks = useMemo(() => networksData, []);
  const total = balance || "0.00";

  useEffect(() => {
    if (!user || !wallet) {
      router.replace("/");
    }
  }, [user, wallet, router]);

  if (!user || !wallet || loading) {
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
          {networks.map((net) => (
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
                  — {net.symbol.toUpperCase()}
                </span>
                <span className={styles.assetEur}>—</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}

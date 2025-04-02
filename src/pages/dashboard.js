"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

import { useMagicLink } from "@/contexts/MagicLinkContext";
import { useBalance } from "@/hooks/useBalance";
import StarsBackground from "@/components/StarsBackground";

import styles from "@/styles/dashboard.module.css";
import background from "@/styles/background.module.css";

const networksData = [
  {
    name: "BNB Smart Chain",
    symbol: "BNB",
    route: "/bnb",
    logo: "https://cryptologos.cc/logos/bnb-bnb-logo.png",
  },
  {
    name: "BSC Testnet",
    symbol: "TBNB",
    route: "/tbnb",
    logo: "https://cryptologos.cc/logos/binance-coin-bnb-logo.png",
  },
  {
    name: "Ethereum",
    symbol: "ETH",
    route: "/eth",
    logo: "https://cryptologos.cc/logos/ethereum-eth-logo.png",
  },
  {
    name: "Polygon",
    symbol: "MATIC",
    route: "/matic",
    logo: "https://cryptologos.cc/logos/polygon-matic-logo.png",
  },
  {
    name: "Avalanche",
    symbol: "AVAX",
    route: "/avax",
    logo: "https://cryptologos.cc/logos/avalanche-avax-logo.png",
  },
];

export default function Dashboard() {
  const router = useRouter();
  const { user, wallet } = useMagicLink();
  const { balances, isLoading } = useBalance();

  const [totalEUR, setTotalEUR] = useState("0.00");

  useEffect(() => {
    if (!user || !wallet?.address) router.push("/");
  }, [user, wallet, router]);

  useEffect(() => {
    const total = Object.values(balances)
      .filter((b) => b && b.eur)
      .reduce((sum, b) => sum + parseFloat(b.eur || 0), 0)
      .toFixed(2);

    setTotalEUR(total);
  }, [balances]);

  const networks = useMemo(() => networksData, []);

  if (!user || !wallet?.address) {
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
          <h2 className={styles.totalValue}>
            {isLoading ? "..." : `€ ${totalEUR}`}
          </h2>
        </div>

        <div className={styles.assetGrid}>
          {networks.map((net) => {
            const bal = balances[net.symbol] || { amount: "0.00000", eur: "0.00" };
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
                    <span className={styles.assetSymbol}>{net.symbol}</span>
                    <span className={styles.assetName}>{net.name}</span>
                  </div>
                </div>

                <div className={styles.assetRight}>
                  <span className={styles.assetAmount}>
                    {bal.amount} {net.symbol}
                  </span>
                  <span className={styles.assetEur}>€ {bal.eur}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}

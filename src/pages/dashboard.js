"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

import { useMagicLink } from "@/contexts/MagicLinkContext";
import { useWalletCheck } from "@/contexts/WalletCheckContext";
import { useWallet } from "@/contexts/WalletContext";

import StarsBackground from "@/components/StarsBackground";
import background from "@/styles/background.module.css";
import styles from "@/styles/dashboard.module.css";

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
  const { user } = useMagicLink();
  const { walletReady } = useWalletCheck();
  const { balance, wallet } = useWallet();

  const [totalEUR, setTotalEUR] = useState("...");

  useEffect(() => {
    if (!user || !walletReady || !wallet?.address) {
      router.push("/");
    }
  }, [user, walletReady, wallet, router]);

  useEffect(() => {
    const eur = (parseFloat(balance || "0") * 500).toFixed(2); // Simuliuota
    setTotalEUR(eur);
  }, [balance]);

  const networks = useMemo(() => networksData, []);

  if (!user || !walletReady || !wallet?.address) {
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
          <h2 className={styles.totalValue}>€ {totalEUR}</h2>
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
                  <span className={styles.assetSymbol}>{net.symbol}</span>
                  <span className={styles.assetName}>{net.name}</span>
                </div>
              </div>

              <div className={styles.assetRight}>
                <span className={styles.assetAmount}>
                  {balance} {net.symbol}
                </span>
                <span className={styles.assetEur}>€ {totalEUR}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}

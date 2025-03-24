"use client";

import React, { useEffect, useMemo, useState } from "react";
import styles from "@/styles/dashboard.module.css";
import { useRouter } from "next/navigation";
import { useMagicLink } from "@/contexts/MagicLinkContext";
import { useBalance } from "@/contexts/BalanceContext";
import Image from "next/image";

const networksData = [
  {
    name: "BNB Smart Chain",
    symbol: "BNB",
    logo: "https://cryptologos.cc/logos/bnb-bnb-logo.png",
  },
  {
    name: "BSC Testnet",
    symbol: "TBNB",
    logo: "https://cryptologos.cc/logos/binance-coin-bnb-logo.png",
  },
  {
    name: "Ethereum",
    symbol: "ETH",
    logo: "https://cryptologos.cc/logos/ethereum-eth-logo.png",
  },
  {
    name: "Polygon",
    symbol: "POL",
    logo: "https://cryptologos.cc/logos/polygon-matic-logo.png",
  },
  {
    name: "Avalanche",
    symbol: "AVAX",
    logo: "https://cryptologos.cc/logos/avalanche-avax-logo.png",
  },
];

export default function Dashboard() {
  const router = useRouter();
  const { user, wallet } = useMagicLink();
  const { balances } = useBalance();
  const address = wallet?.address || "";

  const [cachedBalances, setCachedBalances] = useState({});
  const [totalEUR, setTotalEUR] = useState("0.00");

  useEffect(() => {
    if (!user || !address) router.push("/");
  }, [user, address]);

  useEffect(() => {
    const total = Object.values(balances)
      .reduce((sum, b) => sum + parseFloat(b.eur || 0), 0)
      .toFixed(2);
    setCachedBalances(balances);
    setTotalEUR(total);
  }, [balances]);

  const networks = useMemo(() => networksData, []);

  if (!user || !address) return null;

  return (
    <div className={styles.container}>
      <div className={styles.globalWrapper}>
        <div className={styles.totalBalanceBox}>
          <div className={styles.totalLabel}>TOTAL VALUE</div>
          <div className={styles.totalValue}>€ {totalEUR}</div>
        </div>

        <div className={styles.assetList}>
          {networks.map((net) => {
            const bal = cachedBalances[net.symbol] || {
              amount: "0.0000",
              eur: "0.00",
            };

            return (
              <div key={net.symbol} className={styles.assetItem}>
                <div className={styles.assetLeft}>
                  <Image
                    src={net.logo}
                    alt={net.symbol}
                    width={36}
                    height={36}
                    className={styles.assetLogo}
                    loading="eager"
                    unoptimized
                  />
                  <div className={styles.assetText}>
                    <div className={styles.assetSymbol}>{net.symbol}</div>
                    <div className={styles.assetName}>{net.name}</div>
                  </div>
                </div>

                <div className={styles.assetBalance}>
                  {bal.amount} {net.symbol}
                  <div className={styles.assetEur}>€ {bal.eur}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

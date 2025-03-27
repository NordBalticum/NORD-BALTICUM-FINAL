"use client";

import React, { useEffect, useMemo, useState } from "react";
import styles from "@/styles/dashboard.module.css";
import { useRouter } from "next/navigation";
import { useMagicLink } from "@/contexts/MagicLinkContext";
import { useBalance } from "@/contexts/BalanceContext";
import StarsBackground from "@/components/StarsBackground";
import Image from "next/image";
import BottomNavigation from "@/components/BottomNavigation";
import AvatarDisplay from "@/components/AvatarDisplay";

const networksData = [
  { name: "BNB Smart Chain", symbol: "BNB", logo: "https://cryptologos.cc/logos/bnb-bnb-logo.png", route: "/bnb" },
  { name: "BSC Testnet", symbol: "TBNB", logo: "https://cryptologos.cc/logos/binance-coin-bnb-logo.png", route: "/tbnb" },
  { name: "Ethereum", symbol: "ETH", logo: "https://cryptologos.cc/logos/ethereum-eth-logo.png", route: "/eth" },
  { name: "Polygon", symbol: "POL", logo: "https://cryptologos.cc/logos/polygon-matic-logo.png", route: "/pol" },
  { name: "Avalanche", symbol: "AVAX", logo: "https://cryptologos.cc/logos/avalanche-avax-logo.png", route: "/avax" },
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
      <StarsBackground />

      <div className={styles.dashboardWrapper}>
        <div className={styles.avatarCenter}>
          <AvatarDisplay walletAddress={wallet?.address} size={92} />
        </div>

        <div className={styles.totalValueContainer}>
          <p className={styles.totalLabel}>Total Value</p>
          <p className={styles.totalValue}>€ {totalEUR}</p>
        </div>

        <div className={styles.assetList}>
          {networks.map((net) => {
            const bal = cachedBalances[net.symbol] || { amount: "0.0000", eur: "0.00" };
            return (
              <div
                key={net.symbol}
                className={styles.assetItem}
                onClick={() => router.push(net.route)}
              >
                <div className={styles.assetLeft}>
                  <Image
                    src={net.logo}
                    alt={net.symbol}
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

      <BottomNavigation />
    </div>
  );
}

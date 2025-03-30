"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useMagicLink } from "@/contexts/MagicLinkContext";
import { useWallet } from "@/contexts/WalletContext";
import { useBalance } from "@/contexts/BalanceContext";

import styles from "@/styles/test.module.css";
import StarsBackground from "@/components/StarsBackground";

const networks = [
  { name: "BNB Chain", symbol: "bnb", route: "/bnb" },
  { name: "Ethereum", symbol: "eth", route: "/eth" },
  { name: "Polygon", symbol: "pol", route: "/polygon" },
  { name: "Avalanche", symbol: "avax", route: "/avax" },
];

export default function TestDashboard() {
  const { user } = useMagicLink();
  const { wallet } = useWallet();
  const { balances } = useBalance();
  const router = useRouter();

  useEffect(() => {
    if (!user || !wallet?.address) router.push("/");
  }, [user, wallet]);

  if (!user || !wallet?.address) {
    return <div className={styles.loading}>Loading Wallet...</div>;
  }

  const getBalance = (symbol) => {
    const bal = balances.find((b) => b.symbol === symbol);
    return bal ? parseFloat(bal.amount).toFixed(4) : "0.0000";
  };

  return (
    <main className={styles.container}>
      <StarsBackground />

      <div className={styles.dashboardWrapper}>
        <div className={styles.avatarCenter}>
          <img src="/images/avatar-glow.png" alt="User Avatar" />
        </div>

        <div className={styles.totalValueContainer}>
          <div className={styles.totalLabel}>Total Balance</div>
          <div className={styles.totalValue}>
            ≈ €
            {balances
              .reduce((sum, b) => sum + parseFloat(b.eur || 0), 0)
              .toFixed(2)}
          </div>
        </div>

        <div className={styles.assetList}>
          {networks.map((net) => (
            <div
              key={net.symbol}
              className={styles.assetItem}
              onClick={() => router.push(net.route)}
            >
              <div className={styles.assetLeft}>
                <img
                  src={`https://cryptologos.cc/logos/${net.symbol}-logo.png`}
                  alt={`${net.name} logo`}
                  className={styles.assetLogo}
                  onError={(e) => {
                    e.target.src = "/default-logo.png";
                  }}
                />
                <div className={styles.assetInfo}>
                  <span className={styles.assetSymbol}>{net.symbol.toUpperCase()}</span>
                  <span className={styles.assetName}>{net.name}</span>
                </div>
              </div>
              <div className={styles.assetRight}>
                <span className={styles.assetAmount}>{getBalance(net.symbol)}</span>
                <span className={styles.assetEur}>
                  €{balances.find((b) => b.symbol === net.symbol)?.eur || "0.00"}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}

"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import styles from "@/styles/dashboard.module.css";

import { useMagicLink } from "@/contexts/MagicLinkContext";
import { useWallet } from "@/contexts/WalletContext";
import { useBalances } from "@/contexts/BalanceContext";

const logos = {
  bnb: "https://cryptologos.cc/logos/bnb-bnb-logo.png",
  tbnb: "https://cryptologos.cc/logos/binance-coin-bnb-logo.png",
  eth: "https://cryptologos.cc/logos/ethereum-eth-logo.png",
  matic: "https://cryptologos.cc/logos/polygon-matic-logo.png",
  avax: "https://cryptologos.cc/logos/avalanche-avax-logo.png",
};

const names = {
  bnb: "BNB Smart Chain",
  tbnb: "BSC Testnet",
  eth: "Ethereum",
  matic: "Polygon",
  avax: "Avalanche",
};

export default function Dashboard() {
  const router = useRouter();
  const { user, loading } = useMagicLink();
  const { wallet } = useWallet();
  const { balances, format } = useBalances();

  const [totalEUR, setTotalEUR] = useState("0.00");

  useEffect(() => {
    if (!loading && !user) router.replace("/");
  }, [user, loading, router]);

  useEffect(() => {
    if (balances) {
      const total = Object.entries(balances).reduce((acc, [symbol, amount]) => {
        const eur = format(symbol, amount)?.eur || 0;
        return acc + eur;
      }, 0);
      setTotalEUR(total.toFixed(2));
    }
  }, [balances, format]);

  const tokens = balances ? Object.keys(balances) : [];

  return (
    <main className={styles.container}>
      <div className={styles.dashboardWrapper} style={{ paddingTop: "116px" }}>
        {/* Header */}
        <div
          className={styles.totalValueContainer}
          style={{ marginBottom: "32px", animation: "fadeInDown 0.5s ease-out" }}
        >
          <Image
            src="/icons/logo.svg"
            alt="NordBalticum"
            width={340}
            height={122}
            priority
            className={styles.logo}
          />
          <div style={{ marginTop: "14px" }}>
            <p className={styles.totalLabel}>Total Wallet Value</p>
            <h2 className={styles.totalValue}>€ {totalEUR}</h2>
          </div>
        </div>

        {/* Token Cards */}
        <div className={styles.assetList} style={{ animation: "fadeInUp 0.8s ease-out" }}>
          <div className={styles.tokenGrid}>
            {tokens.map((symbol) => {
              const value = balances[symbol];
              const { eur, usd } = format(symbol, value);

              return (
                <div key={symbol} className={styles.tokenCard}>
                  <div className={styles.tokenHeader}>
                    <Image
                      src={logos[symbol]}
                      alt={symbol}
                      width={30}
                      height={30}
                      style={{ borderRadius: "50%", marginRight: "10px" }}
                      unoptimized
                    />
                    <div>
                      <div className={styles.tokenSymbol}>{symbol.toUpperCase()}</div>
                      <div className={styles.tokenName}>{names[symbol]}</div>
                    </div>
                  </div>

                  <div className={styles.tokenAmount}>
                    {value.toFixed(6)} {symbol.toUpperCase()}
                  </div>

                  <div className={styles.tokenConverted}>
                    ≈ €{eur.toFixed(2)} / ${usd.toFixed(2)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </main>
  );
}

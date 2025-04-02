"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import styles from "@/styles/dashboard.module.css";

// Kontekstai
import { useMagicLink } from "@/contexts/MagicLinkContext";
import { useWallet } from "@/contexts/WalletContext";
import { useBalances } from "@/contexts/BalanceContext";

// Cryptologos.com ikonų hardcoded URL’ai
const iconUrls = {
  bnb: "https://cryptologos.cc/logos/binance-coin-bnb-logo.png",
  tbnb: "https://cryptologos.cc/logos/binance-coin-bnb-logo.png",
  eth: "https://cryptologos.cc/logos/ethereum-eth-logo.png",
  matic: "https://cryptologos.cc/logos/polygon-matic-logo.png",
  avax: "https://cryptologos.cc/logos/avalanche-avax-logo.png",
};

// Vardai
const names = {
  bnb: "BNB",
  tbnb: "BNB Testnet",
  eth: "Ethereum",
  matic: "Polygon",
  avax: "Avalanche",
};

export default function Dashboard() {
  const router = useRouter();
  const { user, loading } = useMagicLink();
  const { wallet } = useWallet();
  const { balances, format } = useBalances();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/");
    }
  }, [user, loading, router]);

  const tokens = balances ? Object.keys(balances) : [];

  return (
    <main className={styles.container}>
      <div className={styles.dashboardWrapper}>
        {/* Logo + Total */}
        <div className={styles.totalValueContainer}>
          <Image
            src="/icons/logo.svg"
            alt="NordBalticum"
            width={320}
            height={110}
            priority
            className={styles.logo}
          />
          <div style={{ marginTop: "14px" }}>
            <p className={styles.totalLabel}>Total Balance</p>
            <h2 className={styles.totalValue}>
              {balances
                ? Object.values(balances).reduce((a, b) => a + b, 0).toFixed(4)
                : "Live Balances"}
            </h2>
          </div>
        </div>

        {/* Token List */}
        <div className={styles.assetList}>
          {tokens.map((symbol) => {
            const value = balances[symbol];
            const { eur, usd } = format(symbol, value);

            return (
              <div key={symbol} className={styles.assetItem}>
                <div className={styles.assetLeft}>
                  <img
                    src={iconUrls[symbol]}
                    alt={symbol}
                    className={styles.assetLogo}
                  />
                  <div className={styles.assetInfo}>
                    <div className={styles.assetSymbol}>
                      {symbol.toUpperCase()}
                    </div>
                    <div className={styles.assetName}>
                      {names[symbol] || symbol}
                    </div>
                  </div>
                </div>

                <div className={styles.assetRight}>
                  <div className={styles.assetAmount}>
                    {value.toFixed(6)} {symbol.toUpperCase()}
                  </div>
                  <div className={styles.assetEur}>
                    ≈ €{eur.toFixed(2)} / ${usd.toFixed(2)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}

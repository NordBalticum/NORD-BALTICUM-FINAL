"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";

import styles from "@/styles/dashboard.module.css";
import { useMagicLink } from "@/contexts/MagicLinkContext";
import { useWallet } from "@/contexts/WalletContext";
import { useBalances } from "@/contexts/BalanceContext";

const Chart = dynamic(() => import("@/components/Chart"), { ssr: false });

const iconUrls = {
  bnb: "https://cryptologos.cc/logos/binance-coin-bnb-logo.png",
  tbnb: "https://cryptologos.cc/logos/binance-coin-bnb-logo.png",
  eth: "https://cryptologos.cc/logos/ethereum-eth-logo.png",
  matic: "https://cryptologos.cc/logos/polygon-matic-logo.png",
  avax: "https://cryptologos.cc/logos/avalanche-avax-logo.png",
};

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

  const [isClient, setIsClient] = useState(false);
  const [selectedToken, setSelectedToken] = useState("bnb");
  const [selectedCurrency, setSelectedCurrency] = useState("eur");

  useEffect(() => {
    if (typeof window !== "undefined") setIsClient(true);
  }, []);

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/");
    }
  }, [user, loading, router]);

  const tokens = balances ? Object.keys(balances) : [];

  if (!isClient || !user) {
    return <div className={styles.loading}>Loading dashboard...</div>;
  }

  return (
    <main className={styles.container}>
      <div className={styles.dashboardWrapper}>

        {/* === LIVE CHART === */}
        <div className={styles.chartSection}>
          <Chart token={selectedToken} currency={selectedCurrency} />

          <div className={styles.chartControls}>
            <select
              className={styles.selector}
              value={selectedToken}
              onChange={(e) => setSelectedToken(e.target.value)}
            >
              {Object.keys(iconUrls).map((key) => (
                <option key={key} value={key}>
                  {names[key]}
                </option>
              ))}
            </select>

            <select
              className={styles.selector}
              value={selectedCurrency}
              onChange={(e) => setSelectedCurrency(e.target.value)}
            >
              <option value="eur">EUR</option>
              <option value="usd">USD</option>
            </select>
          </div>
        </div>

        {/* === CRYPTO BALANCE LIST === */}
        <div className={styles.assetList}>
          {tokens.map((symbol) => {
            const value = balances[symbol];
            const { eur, usd } = format(symbol, value);

            return (
              <div key={symbol} className={styles.assetItem}>
                <div className={styles.assetLeft}>
                  <img
                    src={iconUrls[symbol]}
                    alt={`${symbol}-icon`}
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

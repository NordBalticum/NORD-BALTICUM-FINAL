"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import Image from "next/image"; // <-- vietoje paprasto img naudok Next.js Image komponentą!

import { useMagicLink } from "@/contexts/MagicLinkContext";
import { useWallet } from "@/contexts/WalletContext";
import { useBalances } from "@/contexts/BalanceContext";

import styles from "@/styles/dashboard.module.css";

const LivePriceTable = dynamic(() => import("@/components/LivePriceTable"), { ssr: false });

const iconUrls = {
  eth: "https://cryptologos.cc/logos/ethereum-eth-logo.png",
  bnb: "https://cryptologos.cc/logos/binance-coin-bnb-logo.png",
  tbnb: "https://cryptologos.cc/logos/binance-coin-bnb-logo.png",
  matic: "https://cryptologos.cc/logos/polygon-matic-logo.png",
  avax: "https://cryptologos.cc/logos/avalanche-avax-logo.png",
};

const names = {
  eth: "Ethereum",
  bnb: "BNB",
  tbnb: "BNB Testnet",
  matic: "Polygon",
  avax: "Avalanche",
};

export default function Dashboard() {
  const router = useRouter();
  const { user, loading: userLoading } = useMagicLink();
  const { wallet, loading: walletLoading } = useWallet();
  const { balance, balanceEUR, loading: balanceLoading } = useBalances();

  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsClient(true);
    }
  }, []);

  useEffect(() => {
    if (isClient && !userLoading && !user) {
      router.replace("/");
    }
  }, [isClient, user, userLoading, router]);

  const tokens = useMemo(() => {
    if (!wallet || !wallet.signers) return [];
    return Object.keys(wallet.signers);
  }, [wallet]);

  const isLoading = userLoading || walletLoading || balanceLoading || !isClient;

  if (isLoading) {
    return <div className={styles.loading}>Loading dashboard...</div>;
  }

  return (
    <main className={styles.container}>
      <div className={styles.dashboardWrapper}>
        {/* Live prices table */}
        <LivePriceTable />

        {/* Crypto balances */}
        <div className={styles.assetList}>
          {tokens.length === 0 ? (
            <div className={styles.loading}>No assets found.</div>
          ) : (
            tokens.map((symbol) => {
              const tokenBalance = balance(symbol) || 0;
              const tokenBalanceEUR = balanceEUR(symbol) || 0;

              return (
                <div
                  key={symbol}
                  className={styles.assetItem}
                  onClick={() => {
                    if (isClient) { // apsauga kad SSR metu router nebandytų veikti
                      router.push(`/${symbol}`);
                    }
                  }}
                >
                  <div className={styles.assetLeft}>
                    <Image
                      src={iconUrls[symbol]}
                      alt={`${symbol}-icon`}
                      className={styles.assetLogo}
                      width={40}
                      height={40}
                      priority
                      unoptimized // <-- kad Next.js nesustotų optimizuoti remote img
                    />
                    <div className={styles.assetInfo}>
                      <div className={styles.assetSymbol}>
                        {symbol.toUpperCase()}
                      </div>
                      <div className={styles.assetName}>
                        {names[symbol] || symbol.toUpperCase()}
                      </div>
                    </div>
                  </div>

                  <div className={styles.assetRight}>
                    <div className={styles.assetAmount}>
                      {tokenBalance.toFixed(6)} {symbol.toUpperCase()}
                    </div>
                    <div className={styles.assetEur}>
                      ≈ €{tokenBalanceEUR.toFixed(2)}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </main>
  );
}

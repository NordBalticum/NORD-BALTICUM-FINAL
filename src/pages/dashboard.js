"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import Image from "next/image";

import { useAuth } from "@/contexts/AuthContext"; // ✅ Ultimate Auth Context
import styles from "@/styles/dashboard.module.css";

// ✅ Dynamic import without SSR
const LivePriceTable = dynamic(() => import("@/components/LivePriceTable"), { ssr: false });

// ✅ Icons
const iconUrls = {
  eth: "https://cryptologos.cc/logos/ethereum-eth-logo.png",
  bnb: "https://cryptologos.cc/logos/binance-coin-bnb-logo.png",
  tbnb: "https://cryptologos.cc/logos/binance-coin-bnb-logo.png",
  matic: "https://cryptologos.cc/logos/polygon-matic-logo.png",
  avax: "https://cryptologos.cc/logos/avalanche-avax-logo.png",
};

const names = {
  eth: "Ethereum",
  bnb: "BNB Smart Chain",
  tbnb: "BNB Testnet",
  matic: "Polygon",
  avax: "Avalanche",
};

export default function Dashboard() {
  const router = useRouter();
  const { user, wallet, balances, refreshBalance, loading, activeNetwork } = useAuth();
  const [isClient, setIsClient] = useState(false);

  // ✅ Detect client side
  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsClient(true);
    }
  }, []);

  // ✅ If not logged in → redirect
  useEffect(() => {
    if (isClient && !loading && !user) {
      router.replace("/");
    }
  }, [isClient, loading, user, router]);

  // ✅ Tokens list
  const tokens = useMemo(() => {
    if (!wallet?.signers) return [];
    return Object.keys(wallet.signers);
  }, [wallet]);

  // ✅ Dynamic simulated EUR values
  const eurRates = {
    eth: 2900,
    bnb: 450,
    tbnb: 450,
    matic: 1.5,
    avax: 30,
  };

  const isLoading = loading || !isClient || !wallet;

  if (isLoading) {
    return <div className={styles.loading}>Loading dashboard...</div>;
  }

  return (
    <main className={styles.container}>
      <div className={styles.dashboardWrapper}>
        {/* ✅ Live Prices */}
        <LivePriceTable />

        {/* ✅ User Assets */}
        <div className={styles.assetList}>
          {tokens.length === 0 ? (
            <div className={styles.loading}>No assets found.</div>
          ) : (
            tokens.map((symbol) => {
              const balance = balances?.[symbol] || 0;
              const eurValue = balance * (eurRates[symbol] || 0);

              return (
                <div
                  key={symbol}
                  className={styles.assetItem}
                  onClick={() => {
                    if (isClient) {
                      router.push(`/${symbol}`);
                    }
                  }}
                  role="button"
                  tabIndex={0}
                >
                  <div className={styles.assetLeft}>
                    <Image
                      src={iconUrls[symbol]}
                      alt={`${symbol} logo`}
                      width={40}
                      height={40}
                      className={styles.assetLogo}
                      priority
                      unoptimized
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
                      {balance.toFixed(6)} {symbol.toUpperCase()}
                    </div>
                    <div className={styles.assetEur}>
                      ≈ €{eurValue.toFixed(2)}
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

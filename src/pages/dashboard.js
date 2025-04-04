"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import Image from "next/image";

import { useAuth } from "@/contexts/AuthContext"; // ✅ Ultimate Auth
import styles from "@/styles/dashboard.module.css";

// ✅ Dynamic import without SSR
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
  const { user, wallet, balances, getBalance, loading } = useAuth();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsClient(true);
    }
  }, []);

  useEffect(() => {
    if (isClient && !loading && !user) {
      router.replace("/");
    }
  }, [isClient, loading, user, router]);

  const tokens = useMemo(() => {
    if (!wallet?.signers) return [];
    return Object.keys(wallet.signers);
  }, [wallet]);

  const isLoading = loading || !isClient || !wallet;

  if (isLoading) {
    return <div className={styles.loading}>Loading dashboard...</div>;
  }

  return (
    <main className={styles.container}>
      <div className={styles.dashboardWrapper}>
        {/* ✅ Live Prices */}
        <LivePriceTable />

        {/* ✅ User Crypto Assets */}
        <div className={styles.assetList}>
          {tokens.length === 0 ? (
            <div className={styles.loading}>No assets found.</div>
          ) : (
            tokens.map((symbol) => {
              const tokenBalance = getBalance?.(symbol) || 0;
              const tokenBalanceEUR = balances?.[symbol] ? balances[symbol] * (symbol === "bnb" || symbol === "tbnb" ? 450 : 2500) : 0; // Simuliuojam EUR

              return (
                <div
                  key={symbol}
                  className={styles.assetItem}
                  onClick={() => {
                    if (isClient) {
                      router.push(`/${symbol}`);
                    }
                  }}
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

"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import Image from "next/image";

import { useAuth } from "@/contexts/AuthContext";
import { useBalance } from "@/hooks/useBalance";
import { usePrices } from "@/hooks/usePrices";
import MiniLoadingSpinner from "@/components/MiniLoadingSpinner";
import styles from "@/styles/dashboard.module.css"; 

// ✅ Dynamic Live Prices
const LivePriceTable = dynamic(() => import("@/components/LivePriceTable"), { ssr: false });

// ✅ Token icon URLs and names
const iconUrls = {
  ethereum: "/icons/eth.svg",
  bsc: "/icons/bnb.svg",
  tbnb: "/icons/bnb.svg",
  polygon: "/icons/matic.svg",
  avalanche: "/icons/avax.svg",
};

const names = {
  ethereum: "Ethereum",
  bsc: "BNB Smart Chain",
  tbnb: "BNB Testnet",
  polygon: "Polygon",
  avalanche: "Avalanche",
};

const routeNames = {
  ethereum: "eth",
  bsc: "bnb",
  tbnb: "tbnb",
  polygon: "matic",
  avalanche: "avax",
};

export default function Dashboard() {
  const router = useRouter();
  const { user, wallet, authLoading, walletLoading } = useAuth();
  const { balances, loading: balancesLoading } = useBalance();
  const { prices, loading: pricesLoading } = usePrices();

  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsClient(true);
    }
  }, []);

  useEffect(() => {
    if (isClient && !authLoading && !walletLoading && !user) {
      router.replace("/");
    }
  }, [isClient, authLoading, walletLoading, user, router]);

  // Token list generation
  const tokens = useMemo(() => {
    if (!wallet?.wallet?.address) return [];
    return Object.keys(balances || {});
  }, [wallet, balances]);

  const isLoading = typeof window === "undefined" || !isClient || authLoading || walletLoading || balancesLoading || pricesLoading;

  if (isLoading) {
    return (
      <div style={{
        height: "100vh",                // Full screen height
        width: "100vw",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "transparent",
      }}>
        <MiniLoadingSpinner />
      </div>
    );
  }

  return (
    <main className={styles.container}>
      <div className={styles.dashboardWrapper}>
        
        {/* ✅ Live Price Table */}
        <LivePriceTable />

        {/* ✅ Asset List */}
        <div className={styles.assetList}>
          {tokens.length === 0 ? (
            <div className={styles.loading}>No assets found.</div>
          ) : (
            tokens.map((network) => {
              const balanceData = balances?.[network];
              const priceData = prices?.[network === "tbnb" ? "bsc" : network];

              if (balanceData == null || priceData == null) return null;

              const symbol = routeNames[network] || network;
              const balanceFormatted = parseFloat(balanceData.balance || 0).toFixed(6);
              const eurValue = (parseFloat(balanceData.balance || 0) * (priceData.eur || 0)).toFixed(2);
              const usdValue = (parseFloat(balanceData.balance || 0) * (priceData.usd || 0)).toFixed(2);

              return (
                <div
                  key={network}
                  className={styles.assetItem}
                  onClick={() => router.push(`/${symbol}`)}
                  role="button"
                  tabIndex={0}
                >
                  <div className={styles.assetLeft}>
                    <Image
                      src={iconUrls[network] || "/icons/default-icon.png"}
                      alt={`${symbol} logo`}
                      width={40}
                      height={40}
                      className={styles.assetLogo}
                      priority
                      unoptimized
                    />
                    <div className={styles.assetInfo}>
                      <div className={styles.assetSymbol}>{symbol.toUpperCase()}</div>
                      <div className={styles.assetName}>{names[network]}</div>
                    </div>
                  </div>

                  <div className={styles.assetRight}>
                    <div className={styles.assetAmount}>
                      {balanceFormatted} {symbol.toUpperCase()}
                    </div>
                    <div className={styles.assetEur}>
                      ≈ €{eurValue} | ≈ ${usdValue}
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

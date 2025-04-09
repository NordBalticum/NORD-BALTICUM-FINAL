"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import Image from "next/image";

import { useAuth } from "@/contexts/AuthContext";
import { useBalance } from "@/hooks/useBalance";
import { usePrices } from "@/hooks/usePrices";

import styles from "@/styles/dashboard.module.css";
import MiniLoadingSpinner from "@/components/MiniLoadingSpinner"; // ✅ naudoti Mini spinnerį, premium

// ✅ Dynamic Live Price Table
const LivePriceTable = dynamic(() => import("@/components/LivePriceTable"), { ssr: false });

// ✅ Token ikonų URL
const iconUrls = {
  ethereum: "https://cryptologos.cc/logos/ethereum-eth-logo.png",
  bsc: "https://cryptologos.cc/logos/binance-coin-bnb-logo.png",
  tbnb: "https://cryptologos.cc/logos/binance-coin-bnb-logo.png",
  polygon: "https://cryptologos.cc/logos/polygon-matic-logo.png",
  avalanche: "https://cryptologos.cc/logos/avalanche-avax-logo.png",
};

// ✅ Token pavadinimai
const names = {
  ethereum: "Ethereum",
  bsc: "BNB Smart Chain",
  tbnb: "BNB Testnet",
  polygon: "Polygon",
  avalanche: "Avalanche",
};

// ✅ Simboliai naudojami URL routing
const routeNames = {
  ethereum: "eth",
  bsc: "bnb",
  tbnb: "tbnb",
  polygon: "matic",
  avalanche: "avax",
};

export default function Dashboard() {
  const router = useRouter();
  const { user, wallet, loading: authLoading } = useAuth();
  const { balances, loading: balancesLoading } = useBalance();
  const { prices, loading: pricesLoading } = usePrices();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsClient(true);
    }
  }, []);

  useEffect(() => {
    if (isClient && !authLoading && !user) {
      router.replace("/");
    }
  }, [isClient, authLoading, user, router]);

  const tokens = useMemo(() => {
    if (!wallet?.wallet?.address) return [];
    return Object.keys(balances || {});
  }, [wallet, balances]);

  const isLoading = !isClient || authLoading || balancesLoading || pricesLoading;

  return (
    <main className={styles.container}>
      <div className={styles.dashboardWrapper}>
        {/* ✅ Live Price Lentelė */}
        <LivePriceTable />

        <div className={styles.assetList}>
          {isLoading ? (
            <div className={styles.loaderWrapper}>
              <MiniLoadingSpinner />
            </div>
          ) : tokens.length === 0 ? (
            <div className={styles.noAssets}>No assets found.</div>
          ) : (
            tokens.map((network) => {
              const info = balances?.[network];
              const symbol = info?.symbol?.toLowerCase();
              const balance = parseFloat(info?.balance || 0);

              const priceData = prices?.[network === "tbnb" ? "bsc" : network] || { eur: 0, usd: 0 };
              const eurRate = priceData.eur || 0;
              const usdRate = priceData.usd || 0;

              const eurValue = balance * eurRate;
              const usdValue = balance * usdRate;

              const routeSymbol = routeNames[network] || network;

              return (
                <div
                  key={network}
                  className={styles.assetItem}
                  onClick={() => router.push(`/${routeSymbol}`)}
                  role="button"
                  tabIndex={0}
                >
                  <div className={styles.assetLeft}>
                    <Image
                      src={iconUrls[network] || "/icons/default-icon.png"}
                      alt={`${symbol?.toUpperCase()} logo`}
                      width={40}
                      height={40}
                      className={styles.assetLogo}
                      priority
                      unoptimized
                    />
                    <div className={styles.assetInfo}>
                      <div className={styles.assetSymbol}>
                        {symbol?.toUpperCase() || network.toUpperCase()}
                      </div>
                      <div className={styles.assetName}>
                        {names[network] || "Unknown Network"}
                      </div>
                    </div>
                  </div>

                  <div className={styles.assetRight}>
                    <div className={styles.assetAmount}>
                      {balance.toFixed(6)} {symbol?.toUpperCase()}
                    </div>
                    <div className={styles.assetEur}>
                      ≈ €{eurValue.toFixed(2)} | ≈ ${usdValue.toFixed(2)}
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

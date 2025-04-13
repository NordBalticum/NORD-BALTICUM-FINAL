"use client";

// 1️⃣ Importai
import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import Image from "next/image";

import { useAuth } from "@/contexts/AuthContext";
import { useBalance } from "@/hooks/useBalance";
import { usePrices } from "@/hooks/usePrices";
import MiniLoadingSpinner from "@/components/MiniLoadingSpinner";
import styles from "@/styles/dashboard.module.css";

// 2️⃣ Dinaminis Importas
const LivePriceTable = dynamic(() => import("@/components/LivePriceTable"), { ssr: false });

// 3️⃣ Ikonos ir Vardai
const iconUrls = {
  ethereum: "/icons/eth.svg",
  bnb: "/icons/bnb.svg",
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

// 4️⃣ Main Dashboard
export default function Dashboard() {
  const router = useRouter();
  const { user, wallet, authLoading, walletLoading } = useAuth();
  const [isClient, setIsClient] = useState(false);

  // ✅ Tikrinam ar esam kliente
  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsClient(true);
    }
  }, []);

  // ✅ Redirect į home jei neprisijungęs
  useEffect(() => {
    if (isClient && !authLoading && !walletLoading && !user) {
      router.replace("/");
    }
  }, [isClient, authLoading, walletLoading, user, router]);

  // ✅ Viskas pasiruošę (tikrina user + wallet)
  const ready = isClient && !authLoading && !walletLoading && user && wallet?.wallet;

  // ✅ Naudojam hook'us tik jei ready
  const { balances, loading: balancesLoading, initialLoading: balancesInitialLoading } = ready
    ? useBalance()
    : { balances: {}, loading: true, initialLoading: true };

  const { prices, loading: pricesLoading } = ready
    ? usePrices()
    : { prices: {}, loading: true };

  // ✅ Loader kai nėra pasiruošimo
  if (!ready) {
    return (
      <div className={styles.fullscreenCenter}>
        <MiniLoadingSpinner />
      </div>
    );
  }

  // ✅ Token sąrašas
  const tokens = useMemo(() => {
    if (!wallet?.wallet?.address || !balances || Object.keys(balances).length === 0) {
      return [];
    }
    return Object.keys(balances);
  }, [wallet, balances]);

  // ✅ Dashboard UI
  return (
    <main className={styles.container}>
      <div className={styles.dashboardWrapper}>

        {/* ✅ Live Kainų Lentelė */}
        <LivePriceTable />

        {/* ✅ Asset List */}
        <div className={styles.assetList}>
          {balancesInitialLoading || pricesLoading ? (
            <div className={styles.spinnerWrapper}>
              <MiniLoadingSpinner />
            </div>
          ) : tokens.length === 0 ? (
            <div className={styles.noAssets}>
              No assets found.
            </div>
          ) : (
            tokens.map((network) => {
              const balanceData = balances?.[network];
              const priceData = prices?.[network === "tbnb" ? "bsc" : network];

              if (!balanceData || !priceData || balanceData.balance == null) {
                return (
                  <div key={network} className={styles.assetItem}>
                    <MiniLoadingSpinner />
                  </div>
                );
              }

              const balance = parseFloat(balanceData.balance ?? 0);
              const eur = parseFloat(priceData.eur ?? 0);
              const usd = parseFloat(priceData.usd ?? 0);

              const balanceFormatted = balance.toFixed(6);
              const eurValue = (balance * eur).toFixed(2);
              const usdValue = (balance * usd).toFixed(2);

              const symbol = routeNames[network] || network;

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

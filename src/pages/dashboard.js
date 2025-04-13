"use client";

// 1️⃣ Importai
import { useMemo } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import Image from "next/image";

import { useAuth } from "@/contexts/AuthContext";
import { useBalance } from "@/contexts/BalanceContext";
import { useUserReady } from "@/hooks/useUserReady"; // ✅ Naujas hookas!

import MiniLoadingSpinner from "@/components/MiniLoadingSpinner";
import styles from "@/styles/dashboard.module.css";

// 2️⃣ Dinaminis Importas (SSR false)
const LivePriceTable = dynamic(() => import("@/components/LivePriceTable"), { ssr: false });

// 3️⃣ Ikonos ir Vardai
const iconUrls = {
  eth: "/icons/eth.svg",
  bnb: "/icons/bnb.svg",
  tbnb: "/icons/bnb.svg",
  matic: "/icons/matic.svg",
  avax: "/icons/avax.svg",
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
  const { user } = useAuth(); // ✅ Tik user imame iš AuthContext
  const { balances, prices, loading: balancesLoading } = useBalance(); // ✅ Balansai iš BalanceContext
  const { ready } = useUserReady(); // ✅ Tikrinam readiness!

  // ✅ Tokenų sąrašas
  const tokens = useMemo(() => {
    if (!balances || Object.keys(balances).length === 0) {
      return [];
    }
    return Object.keys(balances);
  }, [balances]);

  // ✅ Loader jei dar nepasiruošęs
  if (!ready || balancesLoading) {
    return (
      <div className={styles.fullscreenCenter}>
        <MiniLoadingSpinner />
      </div>
    );
  }

  return (
    <main className={styles.container}>
      <div className={styles.dashboardWrapper}>

        {/* ✅ Live kainų lentelė */}
        <LivePriceTable />

        {/* ✅ Asset List */}
        <div className={styles.assetList}>
          {tokens.length === 0 ? (
            <div className={styles.noAssets}>
              No assets found.
            </div>
          ) : (
            tokens.map((network) => {
              const balanceValue = balances?.[network];
              const priceData = prices?.[network === "tbnb" ? "bnb" : network];

              if (!balanceValue || !priceData) {
                return (
                  <div key={network} className={styles.assetItem}>
                    <MiniLoadingSpinner />
                  </div>
                );
              }

              const balance = parseFloat(balanceValue);
              const eur = parseFloat(priceData?.eur ?? 0);
              const usd = parseFloat(priceData?.usd ?? 0);

              const balanceFormatted = balance.toFixed(6);
              const eurValue = (balance * eur).toFixed(2);
              const usdValue = (balance * usd).toFixed(2);

              return (
                <div
                  key={network}
                  className={styles.assetItem}
                  onClick={() => router.push(`/${network}`)}
                  role="button"
                  tabIndex={0}
                >
                  <div className={styles.assetLeft}>
                    <Image
                      src={iconUrls[network] || "/icons/default-icon.png"}
                      alt={`${network.toUpperCase()} logo`}
                      width={40}
                      height={40}
                      className={styles.assetLogo}
                      priority
                      unoptimized
                    />
                    <div className={styles.assetInfo}>
                      <div className={styles.assetSymbol}>{network.toUpperCase()}</div>
                      <div className={styles.assetName}>{names[network]}</div>
                    </div>
                  </div>

                  <div className={styles.assetRight}>
                    <div className={styles.assetAmount}>
                      {balanceFormatted} {network.toUpperCase()}
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

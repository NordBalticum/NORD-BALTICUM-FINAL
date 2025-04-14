"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import Image from "next/image";

import { useAuth } from "@/contexts/AuthContext";
import { useNetwork } from "@/contexts/NetworkContext";
import { useBalance } from "@/contexts/BalanceContext";
import { useSystemReady } from "@/hooks/useSystemReady";

import MiniLoadingSpinner from "@/components/MiniLoadingSpinner";
import styles from "@/styles/dashboard.module.css";

// ✅ Dinaminis LivePriceTable importas
const LivePriceTable = dynamic(() => import("@/components/LivePriceTable"), { ssr: false });

// ✅ Tinklų ikonos
const iconUrls = {
  eth: "/icons/eth.svg",
  bnb: "/icons/bnb.svg",
  tbnb: "/icons/bnb.svg",
  matic: "/icons/matic.svg",
  avax: "/icons/avax.svg",
};

// ✅ Tinklų pavadinimai
const names = {
  eth: "Ethereum",
  bnb: "BNB Smart Chain",
  tbnb: "BNB Testnet",
  matic: "Polygon",
  avax: "Avalanche",
};

// ✅ DASHBOARD komponentas
export default function Dashboard() {
  const router = useRouter();
  const { user, wallet } = useAuth();
  const { activeNetwork } = useNetwork();
  const { balances, prices, loading } = useBalance();
  const { ready } = useSystemReady();

  // ✅ Turimų tokenų sąrašas
  const tokens = useMemo(() => {
    if (!balances || Object.keys(balances).length === 0) return [];
    return Object.keys(balances);
  }, [balances]);

  // ✅ Loaderis jei sistema neparuošta
  if (loading || !ready || !user || !wallet || !activeNetwork) {
    return (
      <div className={styles.fullscreenCenter}>
        <MiniLoadingSpinner size={32} />
      </div>
    );
  }

  // ✅ Pagrindinis turinys
  return (
    <main className={styles.container}>
      <div className={styles.dashboardWrapper}>

        {/* ✅ Live kainų lentelė */}
        <LivePriceTable />

        {/* ✅ Turimi asset'ai */}
        <div className={styles.assetList}>
          {tokens.length === 0 ? (
            <div className={styles.noAssets}>No assets found.</div>
          ) : (
            tokens.map((network) => {
              const balanceValue = balances?.[network];
              const priceData = prices?.[network];

              if (balanceValue == null || priceData == null) {
                return (
                  <div key={network} className={styles.assetItem}>
                    <MiniLoadingSpinner size={16} />
                  </div>
                );
              }

              const balance = parseFloat(balanceValue || 0);
              const eur = parseFloat(priceData?.eur || 0);
              const usd = parseFloat(priceData?.usd || 0);

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

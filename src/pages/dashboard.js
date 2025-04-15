"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import Image from "next/image";

import { useSystemReady } from "@/hooks/useSystemReady";
import { useAuth } from "@/contexts/AuthContext";
import { useBalance } from "@/contexts/BalanceContext";
import { useNetwork } from "@/contexts/NetworkContext";

import MiniLoadingSpinner from "@/components/MiniLoadingSpinner";
import styles from "@/styles/dashboard.module.css";

const LivePriceTable = dynamic(() => import("@/components/LivePriceTable"), {
  ssr: false,
});

// ✅ Token icons & full names
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

  // ✅ Pilnas konteksto paruošimas
  const { user, wallet } = useAuth();
  const { activeNetwork } = useNetwork();
  const { balances, prices } = useBalance();
  const { ready, loading } = useSystemReady();

  // ✅ Token sąrašas
  const tokens = useMemo(() => {
    return balances ? Object.keys(balances) : [];
  }, [balances]);

  // ✅ Kol sistema neparuošta – loader
  if (loading || !ready) {
    return (
      <div className={styles.fullscreenCenter}>
        <MiniLoadingSpinner size={32} />
        <p className={styles.loadingText}>Loading dashboard...</p>
      </div>
    );
  }

  return (
    <main className={styles.container}>
      <div className={styles.dashboardWrapper}>
        {/* ✅ Live kaina viršuje */}
        <LivePriceTable />

        {/* ✅ Turimų asset'ų sąrašas */}
        <div className={styles.assetList}>
          {tokens.length === 0 ? (
            <div className={styles.noAssets}>No assets found.</div>
          ) : (
            tokens.map((network) => {
              const balance = balances?.[network];
              const price = prices?.[network];

              if (balance == null || price == null) {
                return (
                  <div key={network} className={styles.assetItem}>
                    <MiniLoadingSpinner size={16} />
                  </div>
                );
              }

              const valueEur = (balance * price.eur).toFixed(2);
              const valueUsd = (balance * price.usd).toFixed(2);

              return (
                <div
                  key={network}
                  className={styles.assetItem}
                  onClick={() => router.push(`/${network}`)}
                  role="button"
                  tabIndex={0}
                >
                  {/* ✅ Kairė pusė: ikona + pavadinimas */}
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

                  {/* ✅ Dešinė pusė: balansas ir vertė */}
                  <div className={styles.assetRight}>
                    <div className={styles.assetAmount}>
                      {balance.toFixed(6)} {network.toUpperCase()}
                    </div>
                    <div className={styles.assetEur}>
                      ≈ €{valueEur} | ≈ ${valueUsd}
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

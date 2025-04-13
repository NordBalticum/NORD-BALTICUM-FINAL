"use client";

// 1️⃣ IMPORTAI
import { useMemo } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import Image from "next/image";

import { useAuth } from "@/contexts/AuthContext";
import { useBalances } from "@/contexts/BalanceContext"; // ✅ Teisingas hookas
import { useAppFullyReady } from "@/hooks/useAppFullyReady"; // ✅ NAUJAS pilnas readiness tikrinimas

import MiniLoadingSpinner from "@/components/MiniLoadingSpinner";
import styles from "@/styles/dashboard.module.css";

// 2️⃣ Dinaminis Importas (SSR false)
const LivePriceTable = dynamic(() => import("@/components/LivePriceTable"), { ssr: false });

// 3️⃣ Ikonos ir Tinklų Vardai
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

// 4️⃣ PAGRINDINIS KOMPONENTAS
export default function Dashboard() {
  const router = useRouter();
  const { user } = useAuth(); // ✅ Tik user paimame
  const { balances, prices, loading: balancesLoading } = useBalances(); // ✅ Balansai iš BalanceContext
  const { ready } = useAppFullyReady(); // ✅ Teisingas app readiness tikrinimas

  // ✅ Tokenų sąrašas (pagal turimus balansus)
  const tokens = useMemo(() => {
    if (!balances || Object.keys(balances).length === 0) {
      return [];
    }
    return Object.keys(balances);
  }, [balances]);

  // ✅ Loader jei nepasiruošęs
  if (!ready || balancesLoading) {
    return (
      <div className={styles.fullscreenCenter}>
        <MiniLoadingSpinner />
      </div>
    );
  }

  // ✅ PAGRINDINIS RENDERIS
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
              const priceData = prices?.[network === "tbnb" ? "bnb" : network]; // tbnb = bnb kainos

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

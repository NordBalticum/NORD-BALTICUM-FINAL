"use client";

// 1️⃣ Importai
import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import Image from "next/image";

import { useAuth } from "@/contexts/AuthContext";
import MiniLoadingSpinner from "@/components/MiniLoadingSpinner";
import styles from "@/styles/dashboard.module.css";

// 2️⃣ Dinaminis Importas
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
  const { user, wallet, balances, rates, authLoading, walletLoading } = useAuth();
  const [isClient, setIsClient] = useState(false);

  // ✅ Saugi window tikrinimo logika
  useEffect(() => {
    if (typeof window !== "undefined") setIsClient(true);
  }, []);

  // ✅ Redirect jei neprisijungęs
  useEffect(() => {
    if (isClient && !authLoading && !walletLoading && !user) {
      router.replace("/");
    }
  }, [isClient, authLoading, walletLoading, user, router]);

  // ✅ Pilnai pasiruošęs statusas
  const ready = isClient && !authLoading && !walletLoading && user && wallet?.wallet;

  // ✅ Tokenų sąrašas
  const tokens = useMemo(() => {
    if (!wallet?.wallet?.address || !balances || Object.keys(balances).length === 0) {
      return [];
    }
    return Object.keys(balances);
  }, [wallet, balances]);

  // ✅ Loader jei dar nepasiruošęs
  if (!ready) {
    return (
      <div className={styles.fullscreenCenter}>
        <MiniLoadingSpinner />
      </div>
    );
  }

  return (
    <main className={styles.container}>
      <div className={styles.dashboardWrapper}>

        {/* ✅ Live Kainų Lentelė */}
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
              const rateValue = rates?.[network === "tbnb" ? "bsc" : network];

              if (!balanceValue || !rateValue) {
                return (
                  <div key={network} className={styles.assetItem}>
                    <MiniLoadingSpinner />
                  </div>
                );
              }

              const balance = parseFloat(balanceValue);
              const eur = parseFloat(rateValue?.eur ?? 0);
              const usd = parseFloat(rateValue?.usd ?? 0);

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

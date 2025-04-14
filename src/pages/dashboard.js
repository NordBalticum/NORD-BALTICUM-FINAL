"use client";

import { useMemo, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import Image from "next/image";

import { useAuth } from "@/contexts/AuthContext";
import { useNetwork } from "@/contexts/NetworkContext";
import { useBalance } from "@/contexts/BalanceContext";
import { useSystemReady } from "@/hooks/useSystemReady";

import MiniLoadingSpinner from "@/components/MiniLoadingSpinner";
import { toast } from "react-toastify";
import styles from "@/styles/dashboard.module.css";

// ✅ Dinaminis LivePriceTable importas (SSR OFF)
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

export default function Dashboard() {
  const router = useRouter();
  const { balances, prices, refetch } = useBalance();
  const { ready, loading } = useSystemReady();

  const [initialLoadDone, setInitialLoadDone] = useState(false);

  // ✅ Tokenų sąrašas pagal balansus
  const tokens = useMemo(() => {
    if (!balances || Object.keys(balances).length === 0) return [];
    return Object.keys(balances);
  }, [balances]);

  // ✅ Tik PRADINIS timeout, kad nerodytų "refresho" ant pirmo įkėlimo
  useEffect(() => {
    if (ready && !initialLoadDone) {
      const timer = setTimeout(() => {
        setInitialLoadDone(true);
      }, 2500); // ✅ 2.5s laukiam po tikro ready
      return () => clearTimeout(timer);
    }
  }, [ready, initialLoadDone]);

  // ✅ Visibility change – refetch tik jei jau esam pilnai pasikrovę
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState === "visible" && initialLoadDone) {
        try {
          await refetch();
          toast.success("✅ Balances refreshed.", { position: "top-center", autoClose: 2500 });
        } catch (error) {
          console.error("Refetch error:", error.message);
        }
      }
    };

    if (typeof window !== "undefined") {
      document.addEventListener("visibilitychange", handleVisibilityChange);
    }
    return () => {
      if (typeof window !== "undefined") {
        document.removeEventListener("visibilitychange", handleVisibilityChange);
      }
    };
  }, [initialLoadDone, refetch]);

  // ✅ Loaderis jei sistema NEparuošta
  if (!ready || loading) {
    return (
      <div className={styles.fullscreenCenter}>
        <MiniLoadingSpinner size={32} />
      </div>
    );
  }

  // ✅ Pagrindinis Dashboard turinys
  return (
    <main className={styles.container}>
      <div className={styles.dashboardWrapper}>
        <LivePriceTable />
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

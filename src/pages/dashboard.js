"use client";

import { useMemo, useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import Image from "next/image";

import { useAuth } from "@/contexts/AuthContext";
import { useBalance } from "@/contexts/BalanceContext";
import { useMinimalReady } from "@/hooks/useMinimalReady";

import MiniLoadingSpinner from "@/components/MiniLoadingSpinner";
import { toast } from "react-toastify";
import styles from "@/styles/dashboard.module.css";

const LivePriceTable = dynamic(() => import("@/components/LivePriceTable"), {
  ssr: false,
});

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
  const { balances, prices, refetch } = useBalance();
  const { ready, loading } = useMinimalReady();

  const [initialLoadDone, setInitialLoadDone] = useState(false);
  const visibilityHandled = useRef(false);

  const tokens = useMemo(() => {
    if (!balances || Object.keys(balances).length === 0) return [];
    return Object.keys(balances);
  }, [balances]);

  useEffect(() => {
    if (ready && !initialLoadDone) {
      const timeout = setTimeout(() => {
        setInitialLoadDone(true);
      }, 500);
      return () => clearTimeout(timeout);
    }
  }, [ready, initialLoadDone]);

  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (
        document.visibilityState === "visible" &&
        initialLoadDone &&
        !visibilityHandled.current
      ) {
        visibilityHandled.current = true;
        try {
          await refetch();
          toast.success("✅ Balances refreshed.", {
            position: "top-center",
            autoClose: 2500,
          });
        } catch (error) {
          console.error("Refetch error:", error.message);
        } finally {
          setTimeout(() => {
            visibilityHandled.current = false;
          }, 2500);
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

  if (loading || !ready) {
    return (
      <div className={styles.fullscreenCenter}>
        <MiniLoadingSpinner size={32} />
      </div>
    );
  }

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
                      <div className={styles.assetSymbol}>
                        {network.toUpperCase()}
                      </div>
                      <div className={styles.assetName}>
                        {names[network]}
                      </div>
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

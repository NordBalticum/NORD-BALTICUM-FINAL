"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import Image from "next/image";
import MiniLoadingSpinner from "@/components/MiniLoadingSpinner";
import styles from "@/styles/dashboard.module.css";

const LivePriceTable = dynamic(() => import("@/components/LivePriceTable"), { ssr: false });

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
  const [isClient, setIsClient] = useState(false);

  // ✅ Pirma žiūrim ar jau klientas
  useEffect(() => {
    setIsClient(true);
  }, []);

  // ✅ STOP jei dar nesame kliente
  if (!isClient) {
    return (
      <div className={styles.fullscreenCenter}>
        <MiniLoadingSpinner />
      </div>
    );
  }

  // ✅ Tik dabar saugiai importuojam useAuth
  const { user, wallet, balances, rates, authLoading, walletLoading } = require("@/contexts/AuthContext").useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !walletLoading && !user) {
      router.replace("/");
    }
  }, [authLoading, walletLoading, user, router]);

  const ready = !authLoading && !walletLoading && user && wallet?.wallet;

  const tokens = useMemo(() => {
    if (!wallet?.wallet?.address || !balances || Object.keys(balances).length === 0) {
      return [];
    }
    return Object.keys(balances);
  }, [wallet, balances]);

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
        <LivePriceTable />
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
                      {balance.toFixed(6)} {network.toUpperCase()}
                    </div>
                    <div className={styles.assetEur}>
                      ≈ €{(balance * eur).toFixed(2)} | ≈ ${(balance * usd).toFixed(2)}
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

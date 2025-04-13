"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import Image from "next/image";
import MiniLoadingSpinner from "@/components/MiniLoadingSpinner";
import styles from "@/styles/tbnb.module.css";

// Premium dinaminis importas
const BnbChartDynamic = dynamic(() => import('@/components/BnbChart').then(mod => mod.default), {
  ssr: false,
  loading: () => <MiniLoadingSpinner />,
});

export default function TBnbPage() {
  const { user, wallet, balances, rates, authLoading, walletLoading } = useAuth();
  const router = useRouter();

  const [balancesReady, setBalancesReady] = useState(false);
  const [chartReady, setChartReady] = useState(false);
  const [chartMounted, setChartMounted] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [errorChart, setErrorChart] = useState(false);

  const isLoadingBalances = authLoading || walletLoading;

  // ✅ Po minimize, lock, sleep - reloadinam puslapį
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        window.location.reload();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  useEffect(() => {
    if (!isLoadingBalances && balances?.tbnb) {
      setBalancesReady(true);
    }
  }, [isLoadingBalances, balances]);

  useEffect(() => {
    if (chartMounted && !chartReady && retryCount < 2) {
      const timeout = setTimeout(() => {
        console.warn(`⏳ Chart not ready. Retrying attempt ${retryCount + 1}...`);
        setRetryCount((prev) => prev + 1);
      }, 10000);

      return () => clearTimeout(timeout);
    } else if (chartMounted && !chartReady && retryCount >= 2) {
      console.error("❌ Chart failed to load after retries.");
      setErrorChart(true);
    }
  }, [chartMounted, chartReady, retryCount]);

  const handleSend = () => router.push("/send");
  const handleReceive = () => router.push("/receive");
  const handleHistory = () => router.push("/transactions");

  if (!user || !wallet) {
    return (
      <main className={styles.pageContainer}>
        <MiniLoadingSpinner />
      </main>
    );
  }

  if (errorChart) {
    return (
      <main className={styles.pageContainer}>
        <div className={styles.pageContent}>
          <div className={styles.errorBox}>
            <h2>Chart failed to load.</h2>
            <p>Please refresh the page or try again later.</p>
          </div>
        </div>
      </main>
    );
  }

  const tbnbBalance = balances?.tbnb ?? { balance: 0 };
  const price = rates?.bsc ?? { eur: 0, usd: 0 };

  const balance = parseFloat(tbnbBalance.balance || 0);
  const eurValue = (balance * (price.eur ?? 0)).toFixed(2);
  const usdValue = (balance * (price.usd ?? 0)).toFixed(2);

  return (
    <main key={retryCount} className={styles.pageContainer}>
      <div className={styles.pageContent}>

        {/* HEADER */}
        <div className={styles.header}>
          <Image
            src="/icons/bnb.svg"
            alt="BNB Logo"
            width={60}
            height={60}
            className={styles.networkLogo}
            priority
          />
          <h1 className={styles.networkNameSmall}>
            Binance Smart Chain (Testnet)
          </h1>

          {/* BALANCE */}
          <div className={styles.balanceBox}>
            {balancesReady ? (
              <>
                <p className={styles.balanceText}>
                  {balance.toFixed(4)} BNB
                </p>
                <p className={styles.balanceFiat}>
                  {eurValue} € | {usdValue} $
                </p>
              </>
            ) : (
              <MiniLoadingSpinner />
            )}
          </div>
        </div>

        {/* CHART */}
        <div className={styles.chartWrapper}>
          <div className={styles.chartBorder}>
            {!chartMounted || !chartReady ? (
              <div className={styles.chartLoading}>
                <MiniLoadingSpinner />
              </div>
            ) : null}
            <div
              style={{
                opacity: chartMounted && chartReady ? 1 : 0,
                transform: chartMounted && chartReady ? "scale(1)" : "scale(0.8)",
                transition: "opacity 0.8s ease, transform 0.8s ease",
                width: "100%",
                height: "100%",
              }}
            >
              <BnbChartDynamic
                onMount={() => {
                  console.log("✅ Chart MOUNTED.");
                  setChartMounted(true);
                  setRetryCount(0);
                }}
                onChartReady={() => {
                  console.log("✅ Chart FULLY READY.");
                  setChartReady(true);
                }}
              />
            </div>
          </div>
        </div>

        {/* ACTION BUTTONS */}
        <div className={styles.actionButtons}>
          <button onClick={handleSend} className={styles.actionButton}>
            Send
          </button>
          <button onClick={handleReceive} className={styles.actionButton}>
            Receive
          </button>
          <button onClick={handleHistory} className={styles.actionButton}>
            History
          </button>
        </div>

      </div>
    </main>
  );
}

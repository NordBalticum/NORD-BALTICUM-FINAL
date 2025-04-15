"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import Image from "next/image";

import { useSystemReady } from "@/hooks/useSystemReady";
import { useAuth } from "@/contexts/AuthContext";
import { useBalance } from "@/contexts/BalanceContext";
import { useNetwork } from "@/contexts/NetworkContext";
import { useSend } from "@/contexts/SendContext";

import MiniLoadingSpinner from "@/components/MiniLoadingSpinner";
import styles from "@/styles/tbnb.module.css";

const BnbChartDynamic = dynamic(() => import("@/components/BnbChart"), {
  ssr: false,
  loading: () => <MiniLoadingSpinner />,
});

export default function TBnbPage() {
  const router = useRouter();
  const { wallet } = useAuth();
  const { balances, prices } = useBalance();
  const { ready, loading } = useSystemReady();

  const [chartReady, setChartReady] = useState(false);
  const [chartMounted, setChartMounted] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [errorChart, setErrorChart] = useState(false);

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

  if (loading || !ready) {
    return (
      <main className={styles.pageContainer}>
        <MiniLoadingSpinner />
      </main>
    );
  }

  if (!wallet?.wallet?.address) {
    router.replace("/");
    return (
      <main className={styles.pageContainer}>
        <MiniLoadingSpinner />
      </main>
    );
  }

  const balance = parseFloat(balances?.tbnb ?? 0);
  const eurValue = (balance * (prices?.tbnb?.eur ?? 0)).toFixed(2);
  const usdValue = (balance * (prices?.tbnb?.usd ?? 0)).toFixed(2);

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
          <h1 className={styles.networkNameSmall}>Binance Smart Chain (Testnet)</h1>
          <div className={styles.balanceBox}>
            <p className={styles.balanceText}>{balance.toFixed(4)} BNB</p>
            <p className={styles.balanceFiat}>{eurValue} € | {usdValue} $</p>
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
                  setChartMounted(true);
                  setRetryCount(0);
                }}
                onChartReady={() => setChartReady(true)}
              />
            </div>
          </div>
        </div>

        {/* ACTION BUTTONS */}
        <div className={styles.actionButtons}>
          <button onClick={handleSend} className={styles.actionButton}>Send</button>
          <button onClick={handleReceive} className={styles.actionButton}>Receive</button>
          <button onClick={handleHistory} className={styles.actionButton}>History</button>
        </div>
      </div>
    </main>
  );
}

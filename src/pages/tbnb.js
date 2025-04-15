"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import Image from "next/image";
import { toast } from "react-toastify";

import { useSystemReady } from "@/hooks/useSystemReady";
import { useAuth } from "@/contexts/AuthContext";
import { useBalance } from "@/contexts/BalanceContext";
import { useNetwork } from "@/contexts/NetworkContext";

import MiniLoadingSpinner from "@/components/MiniLoadingSpinner";
import SendModal from "@/components/SendModal";

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
  const { activeNetwork } = useNetwork();

  const [chartReady, setChartReady] = useState(false);
  const [chartMounted, setChartMounted] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [errorChart, setErrorChart] = useState(false);
  const [showSendModal, setShowSendModal] = useState(false);

  // ✅ Extra safety reload on visibility
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

  // ✅ Retry chart if mount failed
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

  // ✅ Redirect if wallet missing
  useEffect(() => {
    if (ready && !wallet?.wallet?.address) {
      router.replace("/");
    }
  }, [ready, wallet, router]);

  // ✅ Show loading spinner
  if (loading || !ready) {
    return (
      <main className={styles.pageContainer}>
        <MiniLoadingSpinner />
      </main>
    );
  }

  // ✅ Format balances
  const balance = parseFloat(balances?.tbnb ?? 0);
  const eurValue = (balance * (prices?.tbnb?.eur ?? 0)).toFixed(2);
  const usdValue = (balance * (prices?.tbnb?.usd ?? 0)).toFixed(2);

  // ✅ Chart error state
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
        {/* ✅ Header */}
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
            <p className={styles.balanceFiat}>
              {eurValue} € | {usdValue} $
            </p>
          </div>
        </div>

        {/* ✅ Chart */}
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

        {/* ✅ Actions */}
        <div className={styles.actionButtons}>
          <button onClick={() => setShowSendModal(true)} className={styles.actionButton}>
            Send
          </button>
          <button onClick={() => router.push("/receive")} className={styles.actionButton}>
            Receive
          </button>
          <button onClick={() => router.push("/transactions")} className={styles.actionButton}>
            History
          </button>
        </div>

        {/* ✅ Send modal */}
        {showSendModal && <SendModal onClose={() => setShowSendModal(false)} />}
      </div>
    </main>
  );
}

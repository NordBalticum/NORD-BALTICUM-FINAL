"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import Image from "next/image";
import { toast } from "react-toastify";

import { useSystemReady } from "@/hooks/useSystemReady";
import { useAuth } from "@/contexts/AuthContext";
import { useBalance } from "@/contexts/BalanceContext";
import { useNetwork } from "@/contexts/NetworkContext";
import { useSend } from "@/contexts/SendContext";

import MiniLoadingSpinner from "@/components/MiniLoadingSpinner";
import SendModal from "@/components/SendModal";

import styles from "@/styles/tbnb.module.css";

const BnbChartDynamic = dynamic(() => import("@/components/BnbChart"), {
  ssr: false,
  loading: () => null, // no visible spinner
});

export default function TBnbPage() {
  const router = useRouter();
  const { user, wallet } = useAuth();
  const { balances, prices } = useBalance();
  const { ready, loading } = useSystemReady();
  const { activeNetwork } = useNetwork();
  const { sending } = useSend();

  const [chartReady, setChartReady] = useState(false);
  const [chartMounted, setChartMounted] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [errorChart, setErrorChart] = useState(false);
  const [showSendModal, setShowSendModal] = useState(false);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        setTimeout(() => window.location.reload(), 300);
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibilityChange);
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

  useEffect(() => {
    if (ready && !wallet?.wallet?.address) {
      router.replace("/");
    }
  }, [ready, wallet, router]);

  const balance = useMemo(() => parseFloat(balances?.tbnb ?? 0), [balances]);
  const eurValue = useMemo(() => (balance * (prices?.tbnb?.eur ?? 0)).toFixed(2), [balance, prices]);
  const usdValue = useMemo(() => (balance * (prices?.tbnb?.usd ?? 0)).toFixed(2), [balance, prices]);

  if (loading || !ready || sending) {
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

  return (
    <main key={retryCount} className={styles.pageContainer}>
      <div className={styles.pageContent}>
        {/* Header */}
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
            <p className={styles.balanceText}>{balance.toFixed(6)} BNB</p>
            <p className={styles.balanceFiat}>{eurValue} € | {usdValue} $</p>
          </div>
        </div>

{/* Chart */}
<div className={styles.chartWrapper}>
  <div className={styles.chartBorder}>
    <div
      style={{
        opacity: chartMounted && chartReady ? 1 : 0,
        transform: chartMounted && chartReady ? "scale(1)" : "scale(0.85)",
        transition: "opacity 0.8s ease, transform 0.8s ease",
        width: "100%",
        height: "100%",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
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

        {/* Action Buttons */}
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

        {/* SendModal */}
        {showSendModal && (
          <SendModal
            onClose={() => setShowSendModal(false)}
            network="tbnb"
            userEmail={user?.email}
          />
        )}
      </div>
    </main>
  );
}

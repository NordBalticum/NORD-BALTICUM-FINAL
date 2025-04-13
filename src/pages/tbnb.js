'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useBalance } from '@/hooks/useBalance';
import { usePrices } from '@/hooks/usePrices';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import MiniLoadingSpinner from '@/components/MiniLoadingSpinner';
import styles from '@/styles/tbnb.module.css';

// Premium dinaminis importas su spinner fallback
const BnbChartDynamic = dynamic(() => import('@/components/BnbChart').then(mod => mod.default), {
  ssr: false,
  loading: () => <MiniLoadingSpinner />,
});

export default function TBnbPage() {
  const { user, wallet } = useAuth();
  const { balances, initialLoading: balancesLoading } = useBalance();
  const { prices, loading: pricesLoading } = usePrices();
  const router = useRouter();

  const [balancesReady, setBalancesReady] = useState(false);
  const [chartMounted, setChartMounted] = useState(false);
  const [chartFullyReady, setChartFullyReady] = useState(false);
  const [retryTrigger, setRetryTrigger] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [chartFailed, setChartFailed] = useState(false);

  const isLoadingBalances = balancesLoading || pricesLoading;

  useEffect(() => {
    if (!isLoadingBalances) {
      setBalancesReady(true);
    }
  }, [isLoadingBalances]);

  useEffect(() => {
    if (!chartFullyReady && !chartFailed) {
      const timeout = setTimeout(() => {
        console.warn('⏳ Chart still not ready after 10s, retrying...');
        if (failedAttempts >= 1) {
          console.error('❌ Chart failed to load after retries.');
          setChartFailed(true); // Parodom klaidą po 2 kartų
        } else {
          setFailedAttempts(prev => prev + 1);
          setRetryTrigger(prev => !prev); // Perkraunam komponentą
        }
      }, 10000); // 10 sekundžių laukimo

      return () => clearTimeout(timeout);
    }
  }, [chartFullyReady, retryTrigger, failedAttempts, chartFailed]);

  const handleSend = () => router.push('/send');
  const handleReceive = () => router.push('/receive');
  const handleHistory = () => router.push('/history');

  if (!user || !wallet) {
    return (
      <main className={styles.pageContainer}>
        <MiniLoadingSpinner />
      </main>
    );
  }

  return (
    <main key={retryTrigger} className={styles.pageContainer}>
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
                  {(balances?.tbnb?.balance ?? 0).toFixed(4)} BNB
                </p>
                <p className={styles.balanceFiat}>
                  {((balances?.tbnb?.balance ?? 0) * (prices?.tbnb?.eur ?? 0)).toFixed(2)} € | {((balances?.tbnb?.balance ?? 0) * (prices?.tbnb?.usd ?? 0)).toFixed(2)} $
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
            {/* Loading arba Error */}
            {(!chartMounted || !chartFullyReady || chartFailed) && (
              <div className={styles.chartLoading}>
                {chartFailed ? (
                  <div className={styles.errorMessage}>
                    Failed to load chart. Please try again later.
                  </div>
                ) : (
                  <MiniLoadingSpinner />
                )}
              </div>
            )}
            <div
              style={{
                opacity: chartMounted && chartFullyReady && !chartFailed ? 1 : 0,
                transform: chartMounted && chartFullyReady && !chartFailed ? 'scale(1)' : 'scale(0.8)',
                transition: 'opacity 0.8s ease, transform 0.8s ease',
                width: '100%',
                height: '100%',
              }}
            >
              {!chartFailed && (
                <BnbChartDynamic
                  onMount={() => {
                    console.log('✅ Chart MOUNTED.');
                    setChartMounted(true);
                  }}
                  onChartReady={() => {
                    console.log('✅ Chart FULLY READY.');
                    setChartFullyReady(true);
                  }}
                />
              )}
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

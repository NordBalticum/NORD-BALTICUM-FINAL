'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useBalance } from '@/hooks/useBalance';
import { usePrices } from '@/hooks/usePrices';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import MiniLoadingSpinner from '@/components/MiniLoadingSpinner';
import styles from '@/styles/tbnb.module.css';

// Dinaminis importas su fallback spinneriu
const BnbChartDynamic = dynamic(() => import('@/components/BnbChart').then(mod => mod.default), {
  ssr: false,
  loading: () => (
    <div className={styles.chartLoading}>
      <MiniLoadingSpinner />
    </div>
  ),
});

export default function TBnbPage() {
  const { user, wallet } = useAuth();
  const { balances, initialLoading: balancesLoading } = useBalance();
  const { prices, loading: pricesLoading } = usePrices();
  const router = useRouter();

  const [balancesReady, setBalancesReady] = useState(false);
  const [chartReady, setChartReady] = useState(false);

  const isLoadingBalances = balancesLoading || pricesLoading;

  const handleSend = () => router.push('/send');
  const handleReceive = () => router.push('/receive');
  const handleHistory = () => router.push('/history');

  useEffect(() => {
    if (!isLoadingBalances) {
      setBalancesReady(true);
    }
  }, [isLoadingBalances]);

  if (!user || !wallet) {
    return (
      <main className={styles.pageContainer}>
        <MiniLoadingSpinner />
      </main>
    );
  }

  return (
    <main className={styles.pageContainer}>
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
            {!chartReady && (
              <div className={styles.chartLoading}>
                <MiniLoadingSpinner />
              </div>
            )}
            <div
              style={{
                opacity: chartReady ? 1 : 0,
                transform: chartReady ? 'scale(1)' : 'scale(0.8)',
                transition: 'opacity 0.8s ease, transform 0.8s ease',
                width: '100%',
                height: '100%',
              }}
            >
              <BnbChartDynamic
                onChartReady={() => {
                  console.log('✅ Chart FULLY READY.');
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

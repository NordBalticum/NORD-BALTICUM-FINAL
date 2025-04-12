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

// Dinaminis Chart užkrovimas su spinner fallback
const BnbChart = dynamic(() => import('@/components/BnbChart'), {
  loading: () => <div className={styles.chartLoading}><MiniLoadingSpinner /></div>,
  ssr: false,
});

export default function TBnbPage() {
  const { user, wallet } = useAuth();
  const { balances, initialLoading: balancesLoading } = useBalance();
  const { prices, loading: pricesLoading } = usePrices();
  const router = useRouter();

  const [initialLoaded, setInitialLoaded] = useState(false);
  const [chartLoaded, setChartLoaded] = useState(false);

  const isLoadingBalances = balancesLoading || pricesLoading;

  const handleSend = () => router.push('/send');
  const handleReceive = () => router.push('/receive');
  const handleHistory = () => router.push('/history');

  useEffect(() => {
    if (!isLoadingBalances) {
      setInitialLoaded(true);
    }
  }, [isLoadingBalances]);

  // Jei nėra user arba wallet – rodom spinner
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
          <h1 className={styles.networkNameSmall}>
            Binance Smart Chain (Testnet)
          </h1>

          {/* Balance Box */}
          <div className={styles.balanceBox}>
            {initialLoaded ? (
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

        {/* Chart */}
        <div className={styles.chartWrapper}>
          <div className={styles.chartBorder}>
            {!chartLoaded && (
              <div className={styles.chartLoading}>
                <MiniLoadingSpinner />
              </div>
            )}
            <div style={{ opacity: chartLoaded ? 1 : 0, transition: 'opacity 0.6s ease' }}>
              <BnbChart onLoad={() => setChartLoaded(true)} />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
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

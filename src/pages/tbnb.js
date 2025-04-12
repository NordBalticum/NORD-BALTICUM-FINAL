'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useBalance } from '@/hooks/useBalance';
import { usePrices } from '@/hooks/usePrices';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import MiniLoadingSpinner from '@/components/MiniLoadingSpinner';
import BnbChart from '@/components/BnbChart'; // PREMIUM BnbChart komponentas
import styles from '@/styles/tbnb.module.css'; // PREMIUM tbnb.module.css

export default function TBnbPage() {
  const { user, wallet } = useAuth();
  const { balances, initialLoading: balancesInitialLoading } = useBalance();
  const { prices, loading: pricesLoading } = usePrices();
  const router = useRouter();

  const handleSend = () => router.push('/send');
  const handleReceive = () => router.push('/receive');
  const handleHistory = () => router.push('/history');

  if (!user || !wallet) return <MiniLoadingSpinner />;

  return (
    <main className={styles.pageContainer}>
      <div className={styles.pageContent}>

        {/* Header */}
        <div className={styles.header}>
          <Image 
            src="/icons/bnb.svg" 
            alt="BNB Logo" 
            width={50} 
            height={50} 
            className={styles.networkLogo} 
            priority 
          />
          <h1 className={styles.networkNameSmall}>
            Binance Smart Chain (Testnet)
          </h1>

          <div className={styles.balanceBox}>
            {(balancesInitialLoading || pricesLoading) ? (
              <MiniLoadingSpinner />
            ) : (
              <>
                <p className={styles.balanceText}>
                  {balances?.tbnb?.balance?.toFixed(4)} BNB
                </p>
                <p className={styles.balanceFiat}>
                  {(balances?.tbnb?.balance * (prices?.tbnb?.eur || 0)).toFixed(2)} € | {(balances?.tbnb?.balance * (prices?.tbnb?.usd || 0)).toFixed(2)} $
                </p>
              </>
            )}
          </div>
        </div>

        {/* Chart */}
        <div className={styles.chartWrapper}>
          <div className={styles.chartBorder}>
            <div className={styles.chartContainer}>
              <BnbChart />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className={styles.actionButtons}>
          <button onClick={handleSend} className={styles.actionButton}>Send</button>
          <button onClick={handleReceive} className={styles.actionButton}>Receive</button>
          <button onClick={handleHistory} className={styles.actionButton}>History</button>
        </div>

      </div>
    </main>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useBalance } from '@/hooks/useBalance';
import { usePrices } from '@/hooks/usePrices';
import { getTransactions } from '@/utils/networkApi';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, LineElement, CategoryScale, LinearScale, PointElement, Tooltip, Filler } from 'chart.js';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import moment from 'moment';
import { motion, AnimatePresence } from 'framer-motion';
import MiniLoadingSpinner from '@/components/MiniLoadingSpinner';
import styles from '@/styles/networkpages.module.css';

ChartJS.register(LineElement, CategoryScale, LinearScale, PointElement, Tooltip, Filler);

export default function TBnbPage() {
  const { user, wallet, signOut } = useAuth();
  const { balances, loading: balanceLoading, refetch: refreshBalance } = useBalance();
  const { prices, loading: pricesLoading, refetch: refreshPrices } = usePrices();
  const [transactions, setTransactions] = useState([]);
  const [transactionsLoading, setTransactionsLoading] = useState(true);
  const [chartData, setChartData] = useState([]);
  const [initialChartLoading, setInitialChartLoading] = useState(true);
  const [initialBalancesLoading, setInitialBalancesLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (user && wallet) {
      fetchAllData();
    }
  }, [user, wallet]);

  useEffect(() => {
    if (user && wallet && !initialBalancesLoading) {
      fetchChartData(true);
    }
  }, [user, wallet, initialBalancesLoading]);

  useEffect(() => {
    const interval = setInterval(() => {
      silentRefresh();
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const handleVisibilityChange = () => {
        if (document.visibilityState === 'visible') {
          silentRefresh();
        }
      };
      document.addEventListener('visibilitychange', handleVisibilityChange);
      return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }
  }, []);

  useEffect(() => {
    let timer;
    const resetTimer = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        signOut();
      }, 10 * 60 * 1000);
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('mousemove', resetTimer);
      window.addEventListener('keydown', resetTimer);
      resetTimer();
    }
    return () => {
      window.removeEventListener('mousemove', resetTimer);
      window.removeEventListener('keydown', resetTimer);
      clearTimeout(timer);
    };
  }, []);

  const fetchAllData = async () => {
    await Promise.all([
      fetchTransactions(),
      fetchInitialBalances()
    ]);
  };

  const fetchInitialBalances = async () => {
    await Promise.all([refreshBalance(), refreshPrices()]);
    setInitialBalancesLoading(false);
  };

  const silentRefresh = async () => {
    refreshBalance();
    refreshPrices();
    fetchTransactions();
  };

  const fetchTransactions = async () => {
    try {
      const txs = await getTransactions('tbnb', user.email);
      setTransactions(txs ? txs.slice(0, 3) : []);
    } catch (error) {
      console.error('❌ Failed to load transactions', error);
      setTransactions([]);
    } finally {
      setTransactionsLoading(false);
    }
  };

  const fetchChartData = async (showSpinner = false) => {
    if (showSpinner) setInitialChartLoading(true);
    try {
      const response = await fetch(`/api/coingecko?coin=binancecoin&range=30d`);
      const data = await response.json();
      const rawPrices = data?.prices?.map(p => ({
        time: new Date(p[0]).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }),
        value: (p[1] * (balances?.tbnb?.balance || 0)).toFixed(2),
      })) || [];
      setChartData(rawPrices);
    } catch (error) {
      console.error('❌ Failed to load chart data', error);
      setChartData([]);
    } finally {
      if (showSpinner) setInitialChartLoading(false);
    }
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      tooltip: {
        mode: 'index',
        intersect: false,
        callbacks: {
          label: function (context) {
            return `€ ${parseFloat(context.raw).toFixed(2)}`;
          },
        },
      },
    },
    scales: {
      x: {
        ticks: { color: '#fff', autoSkip: true, maxTicksLimit: 8 },
        grid: { display: false }
      },
      y: {
        ticks: {
          color: '#fff',
          callback: value => `€${parseFloat(value).toFixed(2)}`
        },
        grid: { display: false }
      }
    },
  };

  const chartDataset = {
    labels: chartData.map(p => p.time),
    datasets: [
      {
        data: chartData.map(p => p.value),
        fill: true,
        backgroundColor: (context) => {
          const ctx = context.chart.ctx;
          const gradient = ctx.createLinearGradient(0, 0, 0, 300);
          gradient.addColorStop(0, 'rgba(255, 255, 255, 0.2)');
          gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
          return gradient;
        },
        borderColor: '#ffffff',
        pointRadius: 0,
        tension: 0.4,
      },
    ],
  };

  const handleSend = () => router.push('/send');
  const handleReceive = () => router.push('/receive');

  if (!user || !wallet) return <MiniLoadingSpinner />;

  return (
    <main style={{ width: '100vw', height: '100vh', overflowY: 'auto' }} className={styles.pageContainer}>
      <div className={styles.pageContent}>
        
        {/* Header */}
        <div className={styles.header}>
          <Image src="/icons/bnb.svg" alt="BNB Logo" width={48} height={48} className={styles.networkLogo} priority />
          <h1 className={styles.networkNameSmall}>Binance Smart Chain (Testnet)</h1>

          <div className={styles.balanceBox}>
            {initialBalancesLoading ? (
              <MiniLoadingSpinner />
            ) : (
              <>
                <p className={styles.balanceText}>
                  {balances?.tbnb?.balance?.toFixed(4)} BNB
                </p>
                <p className={styles.balanceFiat}>
                  {((balances?.tbnb?.balance || 0) * (prices?.tbnb?.eur || 0)).toFixed(2)} € | {((balances?.tbnb?.balance || 0) * (prices?.tbnb?.usd || 0)).toFixed(2)} $
                </p>
              </>
            )}
          </div>
        </div>

        {/* Chart */}
        <div className={styles.chartWrapper}>
          <div className={styles.chartBorder}>
            {initialChartLoading ? (
              <MiniLoadingSpinner />
            ) : (
              <Line options={chartOptions} data={chartDataset} />
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className={styles.actionButtons}>
          <button onClick={handleSend} className={styles.actionButton}>Send</button>
          <button onClick={handleReceive} className={styles.actionButton}>Receive</button>
        </div>

        {/* Transactions */}
        <div className={styles.transactionsContainer}>
          <h2 className={styles.transactionsTitle}>Recent Transactions</h2>
          <div className={styles.transactionsBox}>
            {transactionsLoading ? (
              <MiniLoadingSpinner />
            ) : transactions.length > 0 ? (
              <AnimatePresence>
                {transactions.map((tx, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.5 }}
                    className={styles.transactionItem}
                  >
                    <div className={styles.transactionLeft}>
                      <div className={styles.transactionIcon} style={{ backgroundColor: tx.type === 'send' ? '#EF4444' : '#22C55E' }}>
                        {tx.type === 'send' ? '↑' : '↓'}
                      </div>
                      <div>
                        <div className={styles.transactionAddress}>
                          {tx.address?.slice(0, 6)}...{tx.address?.slice(-4)}
                        </div>
                        <div className={styles.transactionTime}>{moment(tx.timestamp).fromNow()}</div>
                      </div>
                    </div>
                    <div className={styles.transactionAmount}>
                      {tx.type === 'send' ? '-' : '+'}{parseFloat(tx.amount).toFixed(4)} BNB
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            ) : (
              <div className={styles.spinner}>No transactions found.</div>
            )}
          </div>
        </div>

      </div>
    </main>
  );
  }

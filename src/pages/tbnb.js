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
import styles from '@/styles/networkpages.module.css';

ChartJS.register(LineElement, CategoryScale, LinearScale, PointElement, Tooltip, Filler);

// ✅ Mini Loading Spinner
const MiniSpinner = () => (
  <div className={styles.spinner}>
    <div className={styles.loadingCircle}></div>
  </div>
);

export default function TBnbPage() {
  const { user, wallet, signOut } = useAuth();
  const { balances, loading: balanceLoading, refetch: refreshBalance } = useBalance();
  const { prices, loading: pricesLoading, refetch: refreshPrices } = usePrices();
  const [transactions, setTransactions] = useState([]);
  const [transactionsLoading, setTransactionsLoading] = useState(true);
  const [chartData, setChartData] = useState(null);
  const [chartLoading, setChartLoading] = useState(true);
  const [selectedRange, setSelectedRange] = useState('24h');
  const router = useRouter();

  useEffect(() => {
    if (user && wallet) {
      fetchTransactions();
      fetchChartData();
    }
  }, [user, wallet, selectedRange]);

  // ✅ Real-Time Auto Refresh (kas 30 sek.)
  useEffect(() => {
    const interval = setInterval(() => {
      refreshBalance();
      refreshPrices();
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  // ✅ Inactivity Timeout (logout po 10min)
  useEffect(() => {
    let timer;
    const resetTimer = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        signOut();
      }, 10 * 60 * 1000); // 10 min
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

  const fetchTransactions = async () => {
    setTransactionsLoading(true);
    try {
      const txs = await getTransactions('tbnb', user.email);
      setTransactions(txs.slice(0, 3));
    } catch (error) {
      console.error('Failed to load transactions', error);
    }
    setTransactionsLoading(false);
  };

  const fetchChartData = async () => {
    setChartLoading(true);
    try {
      const response = await fetch(`/api/coingecko?coin=binancecoin&range=${selectedRange}`);
      const data = await response.json();
      const rawPrices = data.prices.map(p => ({
        time: p[0],
        value: p[1],
      }));

      // ✅ Adjust chart to wallet balance * price
      const walletBalance = balances?.tbnb?.balance || 0;
      const adjustedPrices = rawPrices.map(p => ({
        time: p.time,
        value: p.value * walletBalance,
      }));

      setChartData(adjustedPrices);
    } catch (error) {
      console.error('Failed to load chart data', error);
    }
    setChartLoading(false);
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      tooltip: {
        mode: 'index',
        intersect: false,
      },
    },
    scales: {
      x: { display: false },
      y: { display: false },
    },
  };

  const chartDataset = {
    labels: chartData?.map(p => p.time) || [],
    datasets: [
      {
        data: chartData?.map(p => p.value) || [],
        fill: true,
        backgroundColor: (context) => {
          const ctx = context.chart.ctx;
          const gradient = ctx.createLinearGradient(0, 0, 0, 300);
          gradient.addColorStop(0, 'rgba(43, 55, 255, 0.4)');
          gradient.addColorStop(1, 'rgba(10, 18, 42, 0)');
          return gradient;
        },
        borderColor: '#2B37FF',
        pointRadius: 0,
        tension: 0.4,
      },
    ],
  };

  const handleSend = () => router.push('/send');
  const handleReceive = () => router.push('/receive');

  if (!user || !wallet) return <MiniSpinner />;

  return (
    <div className={styles.pageContainer}>
      
      {/* ✅ Header */}
      <div className={styles.header}>
        <Image src="/icons/bnb.svg" alt="BNB Logo" width={50} height={50} className={styles.networkLogo} priority />
        <h1 className={styles.networkNameSmall}>Binance Smart Chain (Testnet)</h1>

        <div className={styles.balanceBox}>
          {balanceLoading || pricesLoading ? (
            <MiniSpinner />
          ) : (
            <>
              <p className={styles.balanceText}>
                {balances?.tbnb?.balance?.toFixed(4)} BNB
              </p>
              <p className={styles.balanceFiat}>
                ≈ ${((balances?.tbnb?.balance || 0) * (prices?.tbnb?.usd || 0)).toFixed(2)} / €{((balances?.tbnb?.balance || 0) * (prices?.tbnb?.eur || 0)).toFixed(2)}
              </p>
            </>
          )}
        </div>
      </div>

      {/* ✅ Chart */}
      <div className={styles.chartWrapper}>
        <div className={styles.chartContainer}>
          {chartLoading ? (
            <MiniSpinner />
          ) : chartData ? (
            <Line options={chartOptions} data={chartDataset} />
          ) : (
            <div className={styles.spinner}>No Chart Data</div>
          )}
        </div>
      </div>

      {/* ✅ Range Selector */}
      <div className={styles.rangeSelector}>
        {['24h', '7d', '14d', '30d'].map((range) => (
          <button
            key={range}
            onClick={() => setSelectedRange(range)}
            className={`${styles.rangeButton} ${selectedRange === range ? styles.rangeButtonActive : ''}`}
          >
            {range}
          </button>
        ))}
      </div>

      {/* ✅ Actions */}
      <div className={styles.actionButtons}>
        <button onClick={handleSend} className={styles.actionButton}>
          Send
        </button>
        <button onClick={handleReceive} className={styles.actionButton}>
          Receive
        </button>
      </div>

      {/* ✅ Transactions */}
      <div className={styles.transactionsContainer}>
        <h2 className={styles.transactionsTitle}>Recent Transactions</h2>
        <div className={styles.transactionsBox}>
          {transactionsLoading ? (
            <MiniSpinner />
          ) : (
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
                      <div className={styles.transactionAddress}>{tx.address?.slice(0, 6)}...{tx.address?.slice(-4)}</div>
                      <div className={styles.transactionTime}>{moment(tx.timestamp).fromNow()}</div>
                    </div>
                  </div>
                  <div className={styles.transactionAmount}>
                    {tx.type === 'send' ? '-' : '+'}{parseFloat(tx.amount).toFixed(4)} BNB
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>
      </div>

    </div>
  );
}

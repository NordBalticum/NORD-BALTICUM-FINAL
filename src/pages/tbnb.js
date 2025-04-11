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

// Mini loading spinner
const MiniSpinner = () => (
  <div className={styles.spinner}>
    <div className={styles.loadingCircle}></div>
  </div>
);

export default function TBnbPage() {
  const { user } = useAuth();
  const { balance, refreshBalance, loading: balanceLoading } = useBalance('tbnb');
  const { prices, refreshPrices, loading: pricesLoading } = usePrices('binancecoin'); // Grąžina usd ir eur
  const [transactions, setTransactions] = useState([]);
  const [transactionsLoading, setTransactionsLoading] = useState(true);
  const [chartData, setChartData] = useState(null);
  const [chartLoading, setChartLoading] = useState(true);
  const [selectedRange, setSelectedRange] = useState('24h');
  const router = useRouter();

  useEffect(() => {
    if (user) {
      fetchTransactions();
      fetchChartData();
    }
  }, [user, selectedRange]);

  useEffect(() => {
    const interval = setInterval(() => {
      refreshBalance();
      refreshPrices();
    }, 30000);
    return () => clearInterval(interval);
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
      const prices = data.prices.map(p => ({
        time: p[0],
        value: p[1],
      }));
      setChartData(prices);
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
          const gradient = ctx.createLinearGradient(0, 0, 0, 400);
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

  if (!user) return null;

  return (
    <div className={styles.pageContainer}>
      
      {/* Header */}
      <div className={styles.header}>
        <Image src="/icons/bnb.svg" alt="BNB Logo" width={64} height={64} className={styles.networkLogo} priority />
        <h1 className={styles.networkName}>Binance Smart Chain (Testnet)</h1>
        <p className={styles.balance}>
          {balanceLoading || pricesLoading ? (
            <MiniSpinner />
          ) : (
            <>
              {balance} BNB ≈ ${ (balance * prices?.usd).toFixed(2) } / €{ (balance * prices?.eur).toFixed(2) }
            </>
          )}
        </p>
      </div>

      {/* Chart */}
      <div className={styles.chartContainer}>
        {chartLoading ? (
          <MiniSpinner />
        ) : chartData ? (
          <Line options={chartOptions} data={chartDataset} />
        ) : (
          <div className={styles.spinner}>No Chart Data</div>
        )}
      </div>

      {/* Range Selector */}
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

      {/* Actions */}
      <div className={styles.actionButtons}>
        <button onClick={handleSend} className={styles.actionButton}>
          Send
        </button>
        <button onClick={handleReceive} className={styles.actionButton}>
          Receive
        </button>
      </div>

      {/* Transactions */}
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

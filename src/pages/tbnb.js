'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useBalance } from '@/hooks/useBalance';
import { usePrices } from '@/hooks/usePrices';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, LineElement, CategoryScale, LinearScale, PointElement, Tooltip, Filler } from 'chart.js';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import MiniLoadingSpinner from '@/components/MiniLoadingSpinner';
import { motion, AnimatePresence } from 'framer-motion';
import styles from '@/styles/networkpages.module.css';

ChartJS.register(LineElement, CategoryScale, LinearScale, PointElement, Tooltip, Filler);

export default function TBnbPage() {
  const { user, wallet } = useAuth();
  const { balances, refetch: refreshBalance, initialLoading: balancesInitialLoading } = useBalance();
  const { prices, refetch: refreshPrices, loading: pricesLoading } = usePrices();
  const [chartData, setChartData] = useState([]);
  const [chartLoading, setChartLoading] = useState(true);
  const [chartKey, setChartKey] = useState(0);
  const [lastChartUpdate, setLastChartUpdate] = useState(0);
  const router = useRouter();

  const isFullyLoading = balancesInitialLoading || pricesLoading || chartLoading;

  useEffect(() => {
    if (user && wallet?.address) {
      fetchAllData();
    }
  }, [user, wallet]);

  useEffect(() => {
    const interval = setInterval(() => {
      silentRefresh();
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchAllData = async () => {
    try {
      await Promise.all([
        refreshBalance(),
        refreshPrices()
      ]);
      await fetchChartData(true);
    } catch (error) {
      console.error('❌ Initial load failed:', error);
      setChartLoading(false);
    }
  };

  const silentRefresh = async () => {
    try {
      await Promise.all([
        refreshBalance(),
        refreshPrices()
      ]);
      fetchChartData(false);
    } catch (error) {
      console.warn('⚠️ Silent refresh failed:', error);
    }
  };

  const fetchChartData = async (showSpinner = false) => {
    const now = Date.now();
    if (now - lastChartUpdate < 60000 && !showSpinner) return;
    if (showSpinner) setChartLoading(true);

    try {
      if (!prices?.tbnb?.eur || !prices?.tbnb?.usd) {
        console.warn('⚠️ Prices not ready yet.');
        return;
      }

      const res = await fetch(`/api/coingecko?coin=binancecoin&range=30d`);
      const data = await res.json();

      const mapped = (data?.prices || []).map(([timestamp, price]) => ({
        time: new Date(timestamp).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }),
        value: ((price * prices.tbnb.eur) / prices.tbnb.usd).toFixed(2),
      }));

      if (mapped.length > 0) {
        const lastPoint = mapped[mapped.length - 1];
        const todayLabel = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
        if (lastPoint.time !== todayLabel) {
          mapped.push({ time: todayLabel, value: lastPoint.value });
        }
      }

      setChartData(mapped);
      setLastChartUpdate(now);
      setChartKey(prev => prev + 1);
    } catch (error) {
      console.error('❌ Chart fetch error:', error);
      setChartData([]);
    } finally {
      if (showSpinner) setChartLoading(false);
    }
  };

  const handleSend = () => router.push('/send');
  const handleReceive = () => router.push('/receive');
  const handleHistory = () => router.push('/history');

  if (!user || !wallet) return <MiniLoadingSpinner />;

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      tooltip: {
        mode: 'index',
        intersect: false,
        callbacks: {
          label: (context) => `€ ${parseFloat(context.raw).toFixed(2)}`,
        },
      },
    },
    scales: {
      x: { ticks: { color: '#fff' }, grid: { display: false } },
      y: { ticks: { color: '#fff', callback: (v) => `€${parseFloat(v).toFixed(2)}` }, grid: { display: false } },
    },
  };

  const chartDataset = {
    labels: chartData.map(p => p.time),
    datasets: [{
      data: chartData.map(p => p.value),
      fill: true,
      backgroundColor: (context) => {
        const ctx = context.chart.ctx;
        const gradient = ctx.createLinearGradient(0, 0, 0, 400);
        gradient.addColorStop(0, 'rgba(255, 255, 255, 0.2)');
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        return gradient;
      },
      borderColor: '#ffffff',
      pointRadius: 0,
      tension: 0.4,
    }],
  };

  return (
    <main className={styles.pageContainer} style={{ width: '100vw', height: '100vh', overflowY: 'auto', background: 'radial-gradient(circle at center, #10131A 0%, #0a0d13 100%)' }}>
      <div className={styles.pageContent} style={{ minHeight: '100vh', width: '100%' }}>

        {/* Header */}
        <motion.div className={styles.header} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1 }}>
          <Image src="/icons/bnb.svg" alt="BNB Logo" width={48} height={48} className={styles.networkLogo} priority />
          <h1 className={styles.networkNameSmall}>Binance Smart Chain (Testnet)</h1>

          <div className={styles.balanceBox}>
            {balancesInitialLoading || pricesLoading ? (
              <MiniLoadingSpinner />
            ) : (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1 }}>
                <p className={styles.balanceText}>
                  {balances?.tbnb?.balance?.toFixed(4)} BNB
                </p>
                <p className={styles.balanceFiat}>
                  {((balances?.tbnb?.balance || 0) * (prices?.tbnb?.eur || 0)).toFixed(2)} € | {((balances?.tbnb?.balance || 0) * (prices?.tbnb?.usd || 0)).toFixed(2)} $
                </p>
              </motion.div>
            )}
          </div>
        </motion.div>

        {/* Chart */}
        <motion.div className={styles.chartWrapper} style={{ width: '92%', margin: '0 auto' }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1.2 }}>
          <div className={styles.chartBorder}>
            {chartLoading ? (
              <MiniLoadingSpinner />
            ) : chartData.length > 0 ? (
              <Line key={chartKey} options={chartOptions} data={chartDataset} />
            ) : (
              <div style={{ color: '#ccc', textAlign: 'center', padding: '2rem' }}>
                No chart data available.
              </div>
            )}
          </div>
        </motion.div>

        {/* Action Buttons */}
        <motion.div className={styles.actionButtons} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1.5 }}>
          <button onClick={handleSend} className={styles.actionButton}>Send</button>
          <button onClick={handleReceive} className={styles.actionButton}>Receive</button>
          <button onClick={handleHistory} className={styles.actionButton}>History</button>
        </motion.div>

      </div>
    </main>
  );
}

'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useBalance } from '@/hooks/useBalance';
import { usePrices } from '@/hooks/usePrices';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, LineElement, CategoryScale, LinearScale, PointElement, Tooltip, Filler } from 'chart.js';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import MiniLoadingSpinner from '@/components/MiniLoadingSpinner';
import styles from '@/styles/networkpages.module.css';

ChartJS.register(LineElement, CategoryScale, LinearScale, PointElement, Tooltip, Filler);

export default function TBnbPage() {
  const { user, wallet } = useAuth();
  const { balances, refetch: refreshBalance, initialLoading: balancesInitialLoading } = useBalance();
  const { prices, refetch: refreshPrices, loading: pricesLoading } = usePrices();

  const [chartData, setChartData] = useState([]);
  const [initialChartLoading, setInitialChartLoading] = useState(true);
  const [chartKey, setChartKey] = useState(0);
  const [lastChartUpdate, setLastChartUpdate] = useState(0);
  const router = useRouter();

  // Pirmas užkrovimas
  useEffect(() => {
    if (user && wallet?.address) {
      fetchAllData();
    }
  }, [user, wallet]);

  // Fono atnaujinimas kas 30s
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
      console.error('❌ Initial data load failed:', error);
      setInitialChartLoading(false);
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
      console.warn('⚠️ Silent refresh error:', error);
    }
  };

  const fetchChartData = useCallback(async (showSpinner = false) => {
    const now = Date.now();
    if (now - lastChartUpdate < 60000 && !showSpinner) return;
    if (showSpinner) setInitialChartLoading(true);

    try {
      const response = await fetch(`https://api.coingecko.com/api/v3/coins/binancecoin/market_chart?vs_currency=eur&days=30`);
      const data = await response.json();

      if (!data?.prices) throw new Error('No price data from Coingecko');

      const formatted = data.prices.map(([timestamp, price]) => ({
        time: new Date(timestamp).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }),
        value: parseFloat(price).toFixed(2)
      }));

      const todayLabel = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
      if (formatted.length > 0 && formatted[formatted.length - 1].time !== todayLabel) {
        formatted.push({ time: todayLabel, value: formatted[formatted.length - 1].value });
      }

      setChartData(formatted);
      setLastChartUpdate(now);
      setChartKey(prev => prev + 1);
    } catch (error) {
      console.error('❌ Chart data fetch error:', error);
      setChartData([]);
    } finally {
      if (showSpinner) setInitialChartLoading(false);
    }
  }, [lastChartUpdate]);

  const handleSend = () => router.push('/send');
  const handleReceive = () => router.push('/receive');
  const handleHistory = () => router.push('/history');

  if (!user || !wallet) return <MiniLoadingSpinner />;

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 1200,
      easing: 'easeOutQuart',
    },
    plugins: {
      tooltip: {
        mode: 'index',
        intersect: false,
        backgroundColor: 'rgba(15,15,15,0.9)',
        titleColor: '#fff',
        bodyColor: '#eee',
        borderColor: '#555',
        borderWidth: 1,
        padding: 12,
        cornerRadius: 8,
        callbacks: {
          label: (context) => `€ ${parseFloat(context.raw).toFixed(2)}`,
        },
      },
    },
    scales: {
      x: {
        ticks: { color: '#aaa', font: { size: 12 } },
        grid: { display: false },
      },
      y: {
        ticks: {
          color: '#aaa',
          font: { size: 12 },
          callback: (v) => `€${parseFloat(v).toFixed(2)}`,
        },
        grid: { color: 'rgba(255,255,255,0.05)' },
      },
    },
  };

  const chartDataset = {
    labels: chartData.map(p => p.time),
    datasets: [{
      data: chartData.map(p => p.value),
      fill: true,
      backgroundColor: (context) => {
        const ctx = context.chart.ctx;
        const gradient = ctx.createLinearGradient(0, 0, 0, 300);
        gradient.addColorStop(0, 'rgba(255, 255, 255, 0.25)');
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        return gradient;
      },
      borderColor: '#ffffff',
      pointRadius: 2,
      borderWidth: 2,
      tension: 0.35,
    }],
  };

  return (
    <main className={styles.pageContainer} style={{ width: '100vw', height: '100vh', overflowY: 'auto', background: '#0a0a0a' }}>
      <div className={styles.pageContent} style={{ minHeight: '100vh', width: '100%', animation: 'fadein 1s ease-out' }}>

        {/* Header */}
        <div className={styles.header}>
          <Image src="/icons/bnb.svg" alt="BNB Logo" width={50} height={50} className={styles.networkLogo} priority />
          <h1 className={styles.networkNameSmall}>Binance Smart Chain (Testnet)</h1>

          <div className={styles.balanceBox}>
            {balancesInitialLoading || pricesLoading ? (
              <MiniLoadingSpinner />
            ) : (
              <>
                <p className={styles.balanceText}>{balances?.tbnb?.balance?.toFixed(4)} BNB</p>
                <p className={styles.balanceFiat}>
                  {((balances?.tbnb?.balance || 0) * (prices?.tbnb?.eur || 0)).toFixed(2)} € | {((balances?.tbnb?.balance || 0) * (prices?.tbnb?.usd || 0)).toFixed(2)} $
                </p>
              </>
            )}
          </div>
        </div>

        {/* Chart */}
        <div className={styles.chartWrapper} style={{ width: '92%', margin: '0 auto' }}>
          <div className={styles.chartBorder}>
            {initialChartLoading ? (
              <MiniLoadingSpinner />
            ) : chartData.length > 0 ? (
              <Line key={chartKey} options={chartOptions} data={chartDataset} />
            ) : (
              <div style={{ color: '#ccc', textAlign: 'center', padding: '2rem' }}>
                No chart data available.
              </div>
            )}
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

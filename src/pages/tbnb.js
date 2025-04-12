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
import styles from '@/styles/networkpages.module.css';

ChartJS.register(LineElement, CategoryScale, LinearScale, PointElement, Tooltip, Filler);

export default function TBnbPage() {
  const { user, wallet } = useAuth();
  const { balances, refetch: refreshBalance, initialLoading: balancesInitialLoading } = useBalance();
  const { prices, refetch: refreshPrices, loading: pricesLoading } = usePrices();
  const [chartData, setChartData] = useState([]);
  const [initialPageLoading, setInitialPageLoading] = useState(true);
  const [chartLoading, setChartLoading] = useState(true);
  const [chartKey, setChartKey] = useState(0);
  const [lastChartUpdate, setLastChartUpdate] = useState(0);
  const router = useRouter();

  // Pagrindinis pirmas užkrovimas
  useEffect(() => {
    if (user && wallet?.address) {
      fetchEverything();
    }
  }, [user, wallet]);

  // Fono atnaujinimas kas 30s
  useEffect(() => {
    const interval = setInterval(() => {
      silentRefresh();
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchEverything = async () => {
    try {
      await Promise.all([
        refreshBalance(),
        refreshPrices()
      ]);

      if (prices?.tbnb?.eur && prices?.tbnb?.usd) {
        await fetchChartData(true);
      } else {
        console.warn('⚠️ Prices not ready, skipping chart loading.');
      }
    } catch (error) {
      console.error('❌ Initial fetch failed:', error);
    } finally {
      setInitialPageLoading(false);
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
        console.warn('⚠️ Prices missing, skipping chart fetch.');
        return;
      }

      const response = await fetch(`/api/coingecko?coin=binancecoin&range=30d`);
      const data = await response.json();

      const parsed = (data?.prices || []).map(p => ({
        time: new Date(p[0]).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }),
        value: ((p[1] * prices.tbnb.eur) / prices.tbnb.usd).toFixed(2)
      }));

      if (parsed.length > 0) {
        const todayLabel = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
        const lastPoint = parsed[parsed.length - 1];
        if (lastPoint.time !== todayLabel) {
          parsed.push({ time: todayLabel, value: lastPoint.value });
        }
      }

      setChartData(parsed);
      setLastChartUpdate(now);
      setChartKey(prev => prev + 1);
    } catch (error) {
      console.error('❌ Chart fetch failed:', error);
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
    animation: {
      duration: 800,
      easing: 'easeOutQuart',
    },
    plugins: {
      tooltip: {
        mode: 'index',
        intersect: false,
        backgroundColor: '#222',
        titleColor: '#fff',
        bodyColor: '#fff',
      },
    },
    scales: {
      x: {
        ticks: { color: '#bbb' },
        grid: { display: false }
      },
      y: {
        ticks: { color: '#bbb', callback: v => `€${parseFloat(v).toFixed(2)}` },
        grid: { display: false }
      }
    }
  };

  const chartDataset = {
    labels: chartData.map(p => p.time),
    datasets: [{
      data: chartData.map(p => p.value),
      fill: true,
      backgroundColor: (context) => {
        const ctx = context.chart.ctx;
        const gradient = ctx.createLinearGradient(0, 0, 0, 400);
        gradient.addColorStop(0, 'rgba(0, 212, 255, 0.25)');
        gradient.addColorStop(1, 'rgba(0, 212, 255, 0)');
        return gradient;
      },
      borderColor: '#00d4ff',
      borderWidth: 2,
      pointRadius: 0,
      tension: 0.4,
    }]
  };

  return (
    <main className={styles.pageContainer} style={{ width: '100vw', height: '100vh', overflowY: 'auto', background: '#0b0f19' }}>
      <div className={styles.pageContent} style={{ minHeight: '100vh', width: '100%', opacity: initialPageLoading ? 0 : 1, transition: 'opacity 0.6s ease-in-out' }}>

        {/* Header */}
        <div className={styles.header}>
          <Image src="/icons/bnb.svg" alt="BNB Logo" width={48} height={48} className={styles.networkLogo} priority />
          <h1 className={styles.networkNameSmall}>Binance Smart Chain (Testnet)</h1>

          <div className={styles.balanceBox}>
            {balancesInitialLoading || pricesLoading ? (
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
        <div className={styles.chartWrapper} style={{ width: '92%', margin: '0 auto' }}>
          <div className={styles.chartBorder}>
            {chartLoading ? (
              <MiniLoadingSpinner />
            ) : chartData.length > 0 ? (
              <Line key={chartKey} options={chartOptions} data={chartDataset} />
            ) : (
              <div style={{ color: '#888', textAlign: 'center', padding: '2rem' }}>
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

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
  const { balances, refetch: refreshBalance } = useBalance();
  const { prices, refetch: refreshPrices } = usePrices();
  const [chartData, setChartData] = useState([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [chartKey, setChartKey] = useState(0);
  const [lastChartUpdate, setLastChartUpdate] = useState(0);
  const router = useRouter();

  useEffect(() => {
    if (user && wallet?.address) {
      fetchAllData();
    }
  }, [user, wallet]);

  useEffect(() => {
    const interval = setInterval(() => {
      silentRefresh();
    }, 30000); // kas 30 sekundžių automatinis atnaujinimas
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
      console.error('❌ Initial fetch error:', error);
    } finally {
      setInitialLoading(false);
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

  const fetchChartData = async (showSpinner = false) => {
    const now = Date.now();
    if (now - lastChartUpdate < 60000 && !showSpinner) return;
    if (showSpinner) setInitialLoading(true);

    try {
      if (!prices?.tbnb?.eur || !prices?.tbnb?.usd) {
        console.warn('⚠️ Prices not ready.');
        return;
      }

      const response = await fetch(`/api/coingecko?coin=binancecoin&range=30d`);
      const data = await response.json();

      const rawPrices = (data?.prices || []).map(p => ({
        time: new Date(p[0]).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }),
        value: ((p[1] * prices.tbnb.eur) / prices.tbnb.usd).toFixed(2),
      }));

      if (rawPrices.length > 0) {
        const lastPoint = rawPrices[rawPrices.length - 1];
        const today = new Date();
        const todayLabel = today.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
        if (lastPoint.time !== todayLabel) {
          rawPrices.push({ time: todayLabel, value: lastPoint.value });
        }
      }

      setChartData(rawPrices);
      setLastChartUpdate(now);
      setChartKey(prev => prev + 1);
    } catch (error) {
      console.error('❌ Failed to load chart data:', error);
      setChartData([]);
    } finally {
      if (showSpinner) setInitialLoading(false);
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
      y: { ticks: { color: '#fff', callback: v => `€${parseFloat(v).toFixed(2)}` }, grid: { display: false } },
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
    <main className={styles.pageContainer} style={{ width: '100vw', height: '100vh', overflowY: 'auto' }}>
      <div className={styles.pageContent} style={{ minHeight: '100vh', width: '100%' }}>

        {/* Header */}
        <div className={styles.header}>
          <Image src="/icons/bnb.svg" alt="BNB Logo" width={48} height={48} className={styles.networkLogo} priority />
          <h1 className={styles.networkNameSmall}>Binance Smart Chain (Testnet)</h1>

          <div className={styles.balanceBox}>
            {initialLoading ? (
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
            {initialLoading ? (
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

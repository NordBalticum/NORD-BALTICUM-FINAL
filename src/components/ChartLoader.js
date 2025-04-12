'use client';

import { useEffect, useState, useRef } from 'react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, LineElement, CategoryScale, LinearScale, PointElement, Tooltip, Filler } from 'chart.js';
import MiniLoadingSpinner from '@/components/MiniLoadingSpinner';
import styles from '@/styles/chartloader.module.css';

ChartJS.register(LineElement, CategoryScale, LinearScale, PointElement, Tooltip, Filler);

export default function ChartLoader({
  coinId = 'binancecoin',
  currency = 'eur',
  days = 30,
  silentRefresh = true,
  backgroundSilent = true,
}) {
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [silentLoading, setSilentLoading] = useState(false);
  const [chartKey, setChartKey] = useState(0);
  const mountedRef = useRef(true);

  const fetchChartData = async (showSpinner = true) => {
    if (!mountedRef.current) return;

    if (showSpinner) {
      if (backgroundSilent) {
        setSilentLoading(true);
      } else {
        setLoading(true);
      }
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);

    try {
      const res = await fetch(
        `https://api.coingecko.com/api/v3/coins/${coinId}/market_chart?vs_currency=${currency}&days=${days}`,
        { signal: controller.signal }
      );
      const data = await res.json();

      if (!data?.prices) throw new Error('No price data');

      const formatted = data.prices.map(([timestamp, price]) => ({
        time: new Date(timestamp).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }),
        value: parseFloat(price).toFixed(2),
      }));

      const todayLabel = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
      if (formatted.length > 0 && formatted[formatted.length - 1].time !== todayLabel) {
        formatted.push({ time: todayLabel, value: formatted[formatted.length - 1].value });
      }

      if (mountedRef.current) {
        setChartData(formatted);
        setChartKey(prev => prev + 1);
      }
    } catch (err) {
      console.error('❌ Chart fetch error:', err.message);
      if (mountedRef.current) setChartData([]);
    } finally {
      clearTimeout(timeout);
      if (mountedRef.current) {
        if (backgroundSilent) {
          setSilentLoading(false);
        } else {
          setLoading(false);
        }
      }
    }
  };

  useEffect(() => {
    mountedRef.current = true;
    fetchChartData(true);

    if (silentRefresh) {
      const interval = setInterval(() => {
        fetchChartData(false); // Silent background refresh
      }, 30000);
      return () => clearInterval(interval);
    }

    return () => {
      mountedRef.current = false; // Cleanup
    };
  }, [coinId, currency, days, silentRefresh, backgroundSilent]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 1000,
      easing: 'easeOutCubic',
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
      tension: 0.4,
    }],
  };

  if (loading) {
    return <MiniLoadingSpinner />;
  }

  if (chartData.length === 0) {
    return (
      <div className={styles.noData}>
        No chart data available.
      </div>
    );
  }

  return (
    <>
      {silentLoading && <div className={styles.silentLoader}>Updating chart...</div>}
      <Line key={chartKey} options={chartOptions} data={chartDataset} />
    </>
  );
}

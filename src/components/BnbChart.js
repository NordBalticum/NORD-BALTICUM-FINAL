'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, LineElement, CategoryScale, LinearScale, PointElement, Tooltip, Filler } from 'chart.js';
import MiniLoadingSpinner from '@/components/MiniLoadingSpinner';
import styles from '@/styles/bnbchart.module.css';

ChartJS.register(LineElement, CategoryScale, LinearScale, PointElement, Tooltip, Filler);

export default function BnbChart() {
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [silentLoading, setSilentLoading] = useState(false);
  const [chartKey, setChartKey] = useState(0);
  const [selectedDays, setSelectedDays] = useState(7);
  const mountedRef = useRef(true);

  const fetchChartData = useCallback(async (days = 7, showSpinner = true) => {
    if (!mountedRef.current) return;

    if (showSpinner) {
      setLoading(true);
    } else {
      setSilentLoading(true);
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);

    try {
      const res = await fetch(
        `https://api.coingecko.com/api/v3/coins/binancecoin/market_chart?vs_currency=eur&days=${days}`,
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
      console.error('❌ BnbChart fetch error:', err.message);
      if (mountedRef.current) setChartData([]);
    } finally {
      clearTimeout(timeout);
      if (mountedRef.current) {
        setLoading(false);
        setSilentLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    fetchChartData(selectedDays, true);

    const interval = setInterval(() => {
      fetchChartData(selectedDays, false);
    }, 30000);

    return () => {
      mountedRef.current = false;
      clearInterval(interval);
    };
  }, [fetchChartData, selectedDays]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    aspectRatio: 2, // <<< PREMIUM aspect ratio
    animation: {
      duration: 800,
      easing: 'easeOutCubic',
    },
    layout: {
      padding: {
        top: 10,
        bottom: 10,
        left: 0,
        right: 0,
      },
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
        padding: 10,
        cornerRadius: 8,
        callbacks: {
          label: (context) => `€ ${parseFloat(context.raw).toFixed(2)}`,
        },
      },
      legend: {
        display: false, // <<< paslepiam legendą
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
    return <div className={styles.noData}>No chart data available.</div>;
  }

  return (
    <div className={styles.chartContainer}>
      <div className={styles.daysSelector}>
        <button
          className={`${styles.dayButton} ${selectedDays === 7 ? styles.active : ''}`}
          onClick={() => setSelectedDays(7)}
        >
          7d
        </button>
        <button
          className={`${styles.dayButton} ${selectedDays === 14 ? styles.active : ''}`}
          onClick={() => setSelectedDays(14)}
        >
          14d
        </button>
        <button
          className={`${styles.dayButton} ${selectedDays === 30 ? styles.active : ''}`}
          onClick={() => setSelectedDays(30)}
        >
          30d
        </button>
      </div>

      {silentLoading && <div className={styles.silentLoader}>Updating...</div>}

      <Line key={chartKey} options={chartOptions} data={chartDataset} />
    </div>
  );
      }

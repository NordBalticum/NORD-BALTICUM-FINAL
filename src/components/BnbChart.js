'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, LineElement, CategoryScale, LinearScale, PointElement, Tooltip, Filler } from 'chart.js';
import MiniLoadingSpinner from '@/components/MiniLoadingSpinner';
import styles from '@/styles/tbnb.module.css';

ChartJS.register(LineElement, CategoryScale, LinearScale, PointElement, Tooltip, Filler);

export default function BnbChart() {
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [silentLoading, setSilentLoading] = useState(false);
  const [chartKey, setChartKey] = useState(0);

  const mountedRef = useRef(true);
  const controllerRef = useRef(null);

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  const fetchChartData = useCallback(async (showSpinner = true) => {
    if (!mountedRef.current) return;

    if (controllerRef.current) {
      controllerRef.current.abort();
    }

    const controller = new AbortController();
    controllerRef.current = controller;

    if (showSpinner) {
      setLoading(true);
    } else {
      setSilentLoading(true);
    }

    const timeout = setTimeout(() => controller.abort(), 6000);

    try {
      const res = await fetch(
        `https://api.coingecko.com/api/v3/coins/binancecoin/market_chart?vs_currency=eur&days=7`,
        { signal: controller.signal }
      );
      const data = await res.json();

      if (!data?.prices) throw new Error('No price data');

      // Formatuojam ir automatiškai mažinam taškus mobile
      let formatted = data.prices.map(([timestamp, price]) => ({
        time: new Date(timestamp).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }),
        value: parseFloat(price).toFixed(2),
      }));

      const todayLabel = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
      if (formatted.length > 0 && formatted[formatted.length - 1].time !== todayLabel) {
        formatted.push({ time: todayLabel, value: formatted[formatted.length - 1].value });
      }

      // Mažinam duomenų kiekį mobile
      if (isMobile && formatted.length > 0) {
        formatted = formatted.filter((_, index) => index % 2 === 0);
      }

      if (mountedRef.current && formatted.length > 0) {
        setChartData(formatted);
        setChartKey(prev => prev + 1);
      }
    } catch (err) {
      console.error('❌ BnbChart fetch error:', err.message);
    } finally {
      clearTimeout(timeout);
      if (mountedRef.current) {
        setLoading(false);
        setSilentLoading(false);
      }
    }
  }, [isMobile]);

  useEffect(() => {
    mountedRef.current = true;

    fetchChartData(true);

    const interval = setInterval(() => {
      fetchChartData(false);
    }, 300000);

    return () => {
      mountedRef.current = false;
      clearInterval(interval);
      if (controllerRef.current) {
        controllerRef.current.abort();
      }
    };
  }, [fetchChartData]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 1200,
      easing: 'easeOutBounce',
    },
    layout: {
      padding: 0, // Pilnas 0 padding, kad pilnai išsitemptų
    },
    plugins: {
      tooltip: {
        mode: 'index',
        intersect: false,
        backgroundColor: 'rgba(15,15,15,0.95)',
        titleColor: '#ffffff',
        bodyColor: '#eeeeee',
        borderColor: '#555',
        borderWidth: 1,
        padding: 12,
        cornerRadius: 8,
        displayColors: false,
        callbacks: {
          label: (context) => `€ ${parseFloat(context.raw).toFixed(2)}`,
        },
      },
      legend: {
        display: false,
      },
    },
    scales: {
      x: {
        ticks: { color: '#aaa', font: { size: isMobile ? 10 : 12 } },
        grid: { display: false },
      },
      y: {
        ticks: {
          color: '#aaa',
          font: { size: isMobile ? 10 : 12 },
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
        gradient.addColorStop(0, 'rgba(255, 255, 255, 0.3)');
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        return gradient;
      },
      borderColor: '#ffffff',
      pointRadius: isMobile ? 2 : 3,
      borderWidth: 2,
      tension: 0.35,
    }],
  };

  if (loading && chartData.length === 0) {
    return <MiniLoadingSpinner />;
  }

  return (
    <div className={styles.chartContainer}>
      {silentLoading && (
        <div className={styles.chartOverlay}>
          <div className={styles.updatingText}>Updating chart...</div>
        </div>
      )}
      <Line key={chartKey} options={chartOptions} data={chartDataset} />
    </div>
  );
}

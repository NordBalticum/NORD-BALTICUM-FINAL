'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, LineElement, CategoryScale, LinearScale, PointElement, Tooltip, Filler, Decimation } from 'chart.js';
import MiniLoadingSpinner from '@/components/MiniLoadingSpinner';
import styles from '@/styles/tbnb.module.css';

// Registruojam Chart komponentus
ChartJS.register(LineElement, CategoryScale, LinearScale, PointElement, Tooltip, Filler, Decimation);

// Debounce funkcija
function debounce(func, wait) {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      func.apply(null, args);
    }, wait);
  };
}

export default function BnbChart({ onChartReady }) {
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [silentLoading, setSilentLoading] = useState(false);
  const [chartRendered, setChartRendered] = useState(false);
  const chartRef = useRef(null);

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
      const res = await fetch('https://api.coingecko.com/api/v3/coins/binancecoin/market_chart?vs_currency=eur&days=7', { signal: controller.signal });
      const data = await res.json();
      if (!data?.prices) throw new Error('No price data');

      const formatted = data.prices.map(([timestamp, price]) => {
        const date = new Date(timestamp);
        const day = date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
        const hour = date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
        return {
          time: `${day} ${hour}`,
          value: parseFloat(price).toFixed(2),
        };
      });

      if (mountedRef.current && formatted.length > 0) {
        setChartData(formatted);
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
    }, 3600000);

    return () => {
      mountedRef.current = false;
      clearInterval(interval);
      if (controllerRef.current) {
        controllerRef.current.abort();
      }
    };
  }, [fetchChartData]);

  // Kai loading baigėsi ir duomenys yra – signalizuojam parentui
  useEffect(() => {
    if (!loading && chartData.length > 0 && chartRendered && typeof onChartReady === 'function') {
      onChartReady();
    }
  }, [loading, chartData, chartRendered, onChartReady]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 1000,
      easing: 'easeOutBounce',
      onComplete: () => {
        setChartRendered(true); // Signalizuojam kai grafikas nupaišytas
      }
    },
    layout: { padding: 0 },
    plugins: {
      tooltip: { mode: 'index', intersect: false },
      legend: { display: false },
      decimation: {
        enabled: true,
        algorithm: 'lttb',
        samples: isMobile ? 7 : 50,
      },
    },
    scales: {
      x: { ticks: { color: '#bbb' }, grid: { display: false } },
      y: { ticks: { color: '#bbb' }, grid: { color: 'rgba(255,255,255,0.05)' } },
    },
    elements: {
      line: { tension: 0.35 },
      point: { radius: isMobile ? 2 : 3 },
    },
  };

  const chartDataset = {
    labels: chartData.map(p => p.time),
    datasets: [{
      data: chartData.map(p => p.value),
      fill: true,
      backgroundColor: (ctx) => {
        const gradient = ctx.chart.ctx.createLinearGradient(0, 0, 0, 300);
        gradient.addColorStop(0, 'rgba(255,255,255,0.3)');
        gradient.addColorStop(1, 'rgba(255,255,255,0)');
        return gradient;
      },
      borderColor: '#ffffff',
      borderWidth: 2,
    }],
  };

  if (loading && chartData.length === 0) {
    return <MiniLoadingSpinner />;
  }

  return (
    <div className={styles.chartContainer}>
      <Line
        ref={chartRef}
        data={chartDataset}
        options={chartOptions}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'contain',
          overflow: 'hidden',
        }}
      />
    </div>
  );
}

'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, LineElement, CategoryScale, LinearScale, PointElement, Tooltip, Filler, Decimation } from 'chart.js';
import MiniLoadingSpinner from '@/components/MiniLoadingSpinner';
import styles from '@/styles/tbnb.module.css';

// Registruojam Chart komponentus
ChartJS.register(LineElement, CategoryScale, LinearScale, PointElement, Tooltip, Filler, Decimation);

export default function BnbChart({ onChartReady }) {
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
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
    controllerRef = controller;

    if (showSpinner) {
      setLoading(true);
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
          fullLabel: `${day} ${hour}`,
          shortLabel: `${day}`,
          value: parseFloat(price).toFixed(2),
        };
      });

      let filtered = formatted;

      if (isMobile) {
        const step = Math.ceil(formatted.length / 7);
        filtered = formatted.filter((_, index) => index % step === 0);
      }

      if (mountedRef.current && filtered.length > 0) {
        setChartData(filtered);
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('❌ BnbChart fetch error:', err.message);
      }
    } finally {
      clearTimeout(timeout);
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [isMobile]);

  useEffect(() => {
    mountedRef.current = true;
    fetchChartData(true);

    const interval = setInterval(() => {
      fetchChartData(false);
    }, 3600000);

    // **Tab / Window / Phone protection**
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        mountedRef.current = false;
        if (controllerRef.current) controllerRef.current.abort();
      } else if (document.visibilityState === 'visible') {
        mountedRef.current = true;
        fetchChartData(false);
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      mountedRef.current = false;
      clearInterval(interval);
      if (controllerRef.current) controllerRef.current.abort();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [fetchChartData]);

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
        setChartRendered(true);
      }
    },
    layout: {
      padding: {
        left: 15,
        right: 15,
        top: 0,
        bottom: 0,
      }
    },
    plugins: {
      tooltip: {
        mode: 'index',
        intersect: false,
        backgroundColor: 'rgba(15,15,15,0.92)',
        titleColor: '#ffffff',
        bodyColor: '#dddddd',
        borderColor: '#555',
        borderWidth: 1,
        padding: 10,
        cornerRadius: 8,
        displayColors: false,
        callbacks: {
          title: (tooltipItems) => {
            const index = tooltipItems[0].dataIndex;
            return chartData[index]?.fullLabel || '';
          },
          label: (context) => `€ ${parseFloat(context.raw).toFixed(2)}`,
        },
      },
      legend: { display: false },
      decimation: {
        enabled: true,
        algorithm: 'lttb',
        samples: isMobile ? 7 : 50,
      },
    },
    scales: {
      x: {
        ticks: {
          color: '#bbb',
          font: { size: isMobile ? 10 : 12 },
          padding: 10,
          maxRotation: 45,
          minRotation: 0,
          maxTicksLimit: isMobile ? 7 : 14,
          callback: function(value, index) {
            return chartData[index]?.shortLabel || '';
          }
        },
        grid: { display: false },
      },
      y: {
        ticks: {
          color: '#bbb',
          font: { size: isMobile ? 10 : 12 },
          callback: (v) => `€${parseFloat(v).toFixed(2)}`,
          padding: 6,
        },
        grid: { color: 'rgba(255,255,255,0.05)' },
      },
    },
    elements: {
      line: { tension: 0.35 },
      point: { radius: isMobile ? 2 : 3 },
    },
  };

  const chartDataset = {
    labels: chartData.map(p => p.shortLabel),
    datasets: [{
      data: chartData.map(p => parseFloat(p.value)),
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

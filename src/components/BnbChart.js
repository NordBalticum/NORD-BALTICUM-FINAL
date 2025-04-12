'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, LineElement, CategoryScale, LinearScale, PointElement, Tooltip, Filler, Decimation } from 'chart.js';
import MiniLoadingSpinner from '@/components/MiniLoadingSpinner';
import styles from '@/styles/tbnb.module.css';

// Registruojam ChartJS komponentus
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

export default function BnbChart({ onLoad }) {
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [silentLoading, setSilentLoading] = useState(false);
  const [chartKey, setChartKey] = useState(0);
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
      const res = await fetch(
        `https://api.coingecko.com/api/v3/coins/binancecoin/market_chart?vs_currency=eur&days=7`,
        { signal: controller.signal }
      );
      const data = await res.json();

      if (!data?.prices) throw new Error('No price data');

      const formatted = data.prices.map(([timestamp, price]) => {
        const date = new Date(timestamp);
        const day = date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
        const hour = date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
        return {
          time: `${day} ${hour}`,
          value: parseFloat(price).toFixed(2),
          rawDate: date.toDateString(),
          rawHour: date.getHours()
        };
      });

      const unique = [];
      const map = new Map();
      for (const item of formatted) {
        const key = `${item.rawDate}-${item.rawHour}`;
        if (!map.has(key)) {
          map.set(key, true);
          unique.push(item);
        }
      }

      let filtered = unique;
      if (isMobile) {
        filtered = unique.filter(item => item.time.includes('00:00'));
      }

      const today = new Date();
      const todayLabel = today.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
      if (filtered.length > 0 && !filtered[filtered.length - 1].time.includes(todayLabel)) {
        const last = filtered[filtered.length - 1];
        filtered.push({
          time: `${todayLabel} 00:00`,
          value: last.value
        });
      }

      if (mountedRef.current && filtered.length > 0) {
        setChartData(filtered);
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
    }, 300000); // kas 5 min

    return () => {
      mountedRef.current = false;
      clearInterval(interval);
      if (controllerRef.current) {
        controllerRef.current.abort();
      }
    };
  }, [fetchChartData]);

  // Kai užsikrauna grafikas – triggerinam onLoad parentui
  useEffect(() => {
    if (!loading && chartData.length > 0) {
      onLoad?.();
    }
  }, [loading, chartData, onLoad]);

  // Pilnas stabilus resize + reanimate
  useEffect(() => {
    const handleResize = debounce(() => {
      requestAnimationFrame(() => {
        if (chartRef.current && chartRef.current.resize) {
          try {
            chartRef.current.resize();
            chartRef.current.update('active');
          } catch (e) {
            console.error('Chart resize error:', e);
          }
        }
      });
    }, 300);

    window.addEventListener('resize', handleResize);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible' && chartRef.current) {
        try {
          chartRef.current.resize();
          chartRef.current.update('active');
        } catch (e) {
          console.error('Chart visibility change error:', e);
        }
      }
    });

    return () => {
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('visibilitychange', handleResize);
    };
  }, []);

  if (loading && chartData.length === 0) {
    return <MiniLoadingSpinner />;
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 1000,
      easing: 'easeOutBounce',
    },
    layout: { padding: 0 },
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
          padding: 6,
          maxRotation: 45,
          minRotation: 0,
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
      tension: 0.35,
      hoverBorderColor: '#ffd700',
    }],
  };

  return (
    <div
      className={styles.chartContainer}
      style={{
        opacity: loading ? 0 : 1,
        transform: loading ? 'scale(0.8)' : 'scale(1)',
        transition: 'opacity 0.8s ease, transform 0.8s ease',
      }}
    >
      {silentLoading && (
        <div className={styles.chartOverlay}>
          <div className={styles.updatingText}>Updating chart...</div>
        </div>
      )}
      <Line
        ref={chartRef}
        key={chartKey}
        options={chartOptions}
        data={chartDataset}
        style={{
          width: '100%',
          height: '100%',
          maxWidth: '100%',
          maxHeight: '100%',
          objectFit: 'contain',
          overflow: 'hidden',
        }}
      />
    </div>
  );
}

'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, LineElement, CategoryScale, LinearScale, PointElement, Tooltip, Filler, Decimation } from 'chart.js';
import MiniLoadingSpinner from '@/components/MiniLoadingSpinner';
import styles from '@/styles/tbnb.module.css';

ChartJS.register(LineElement, CategoryScale, LinearScale, PointElement, Tooltip, Filler, Decimation);

function debounce(func, wait) {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(null, args), wait);
  };
}

export default function BnbChart({ onChartReady }) {
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const chartRef = useRef(null);
  const mountedRef = useRef(true);
  const controllerRef = useRef(null);
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  const fetchChartData = useCallback(async () => {
    if (!mountedRef.current) return;
    if (controllerRef.current) controllerRef.current.abort();

    const controller = new AbortController();
    controllerRef.current = controller;

    setLoading(true);

    try {
      const res = await fetch('https://api.coingecko.com/api/v3/coins/binancecoin/market_chart?vs_currency=eur&days=7', { signal: controller.signal });
      const data = await res.json();
      if (!data?.prices) throw new Error('No price data');

      const formatted = data.prices.map(([timestamp, price]) => {
        const date = new Date(timestamp);
        return {
          time: `${date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })} ${date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`,
          value: parseFloat(price).toFixed(2),
        };
      });

      const filtered = isMobile
        ? formatted.filter(item => item.time.includes('00:00'))
        : formatted;

      if (mountedRef.current && filtered.length > 0) {
        setChartData(filtered);
      }
    } catch (err) {
      console.error('❌ Chart fetch error:', err.message);
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [isMobile]);

  useEffect(() => {
    mountedRef.current = true;
    fetchChartData();
    const interval = setInterval(fetchChartData, 3600000);

    return () => {
      mountedRef.current = false;
      clearInterval(interval);
      if (controllerRef.current) controllerRef.current.abort();
    };
  }, [fetchChartData]);

  // Tik kai grafikas RENDERINAS su duomenimis
  useEffect(() => {
    if (!loading && chartData.length > 0 && chartRef.current) {
      onChartReady?.();
    }
  }, [loading, chartData, onChartReady]);

  useEffect(() => {
    const handleResize = debounce(() => {
      requestAnimationFrame(() => {
        if (chartRef.current?.resize) {
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
    document.addEventListener('visibilitychange', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('visibilitychange', handleResize);
    };
  }, []);

  if (loading || chartData.length === 0) {
    return (
      <div className={styles.chartContainer}>
        <MiniLoadingSpinner />
      </div>
    );
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 800,
      easing: 'easeOutBounce',
    },
    plugins: {
      tooltip: {
        mode: 'index',
        intersect: false,
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
        ticks: { color: '#bbb', font: { size: isMobile ? 10 : 12 } },
        grid: { display: false },
      },
      y: {
        ticks: { color: '#bbb', font: { size: isMobile ? 10 : 12 } },
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
        try {
          const gradient = ctx.chart.ctx.createLinearGradient(0, 0, 0, 300);
          gradient.addColorStop(0, 'rgba(255,255,255,0.3)');
          gradient.addColorStop(1, 'rgba(255,255,255,0)');
          return gradient;
        } catch (e) {
          return 'rgba(255,255,255,0.2)';
        }
      },
      borderColor: '#ffffff',
      borderWidth: 2,
      hoverBorderColor: '#ffd700',
    }],
  };

  return (
    <div className={styles.chartContainer}>
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

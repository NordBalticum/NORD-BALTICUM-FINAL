'use client';

import { useEffect, useState, useRef } from 'react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, LineElement, CategoryScale, LinearScale, PointElement, Tooltip, Filler, Decimation } from 'chart.js';
import MiniLoadingSpinner from '@/components/MiniLoadingSpinner';
import styles from '@/styles/tbnb.module.css';

ChartJS.register(LineElement, CategoryScale, LinearScale, PointElement, Tooltip, Filler, Decimation);

export default function BnbChart({ onChartReady }) {
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [chartRendered, setChartRendered] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const chartRef = useRef(null);

  const mountedRef = useRef(true);
  const controllerRef = useRef(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const checkMobile = () => {
        setIsMobile(window.innerWidth < 768);
      };
      checkMobile();
      window.addEventListener('resize', checkMobile);
      return () => window.removeEventListener('resize', checkMobile);
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;

    const fetchChartData = async (showSpinner = true) => {
      if (!mountedRef.current) return;

      if (controllerRef.current) {
        controllerRef.current.abort();
      }

      const controller = new AbortController();
      controllerRef.current = controller;

      if (showSpinner) setLoading(true);

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
            rawDate: date.toDateString(),
            rawHour: date.getHours(),
          };
        });

        // Unikalūs taškai per valandą
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
          filtered = unique.filter(item => item.rawHour === 0); // Mobile tik 00:00
        }

        if (mountedRef.current && filtered.length > 0) {
          setChartData(filtered);
        }
      } catch (err) {
        console.error('❌ BnbChart fetch error:', err.message);
      } finally {
        clearTimeout(timeout);
        if (mountedRef.current) setLoading(false);
      }
    };

    fetchChartData(true);

    const interval = setInterval(() => {
      fetchChartData(false);
    }, 3600000);

    return () => {
      mountedRef.current = false;
      clearInterval(interval);
      if (controllerRef.current) controllerRef.current.abort();
    };
  }, [isMobile]);

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

"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { Line, Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  LineElement,
  BarElement,
  BarController,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
  Filler,
  Decimation,
} from "chart.js";

import MiniLoadingSpinner from "@/components/MiniLoadingSpinner";
import styles from "@/styles/tbnb.module.css";

ChartJS.register(
  LineElement,
  BarElement,
  BarController,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
  Filler,
  Decimation
);

const STORAGE_KEY = "nb_bnb_chart";

export default function BnbChart() {
  // — State
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(7);
  const [showDropdown, setShowDropdown] = useState(false);
  const [useBar, setUseBar] = useState(true);

  // — Refs
  const chartRef = useRef(null);
  const mountedRef = useRef(false);
  const controllerRef = useRef(null);
  const dropdownRef = useRef(null);

  // — Detect mobile
  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;

  // — Fetch and format data
  const fetchData = useCallback(
    async (d = 7) => {
      if (!mountedRef.current) return;
      setLoading(true);
      controllerRef.current?.abort();

      const ctrl = new AbortController();
      controllerRef.current = ctrl;

      try {
        const res = await fetch(
          `https://api.coingecko.com/api/v3/coins/binancecoin/market_chart?vs_currency=eur&days=${d}`,
          { signal: ctrl.signal }
        );
        const json = await res.json();
        if (!json.prices) throw new Error("No data");

        const raw = json.prices.map(([t, p]) => {
          const date = new Date(t);
          const day = date.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
          const hour = date.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
          return { fullLabel: `${day} ${hour}`, shortLabel: day, value: +p };
        });

        // — Downsample
        const per = isMobile ? 2 : 6;
        const step = Math.max(1, Math.ceil(raw.length / (d * per)));
        const sampled = raw.filter((_, i) => i % step === 0);

        // — Cache
        try {
          localStorage.setItem(`${STORAGE_KEY}_${d}`, JSON.stringify(sampled));
        } catch {}

        setChartData(sampled);
      } catch (err) {
        console.warn("Fetch error:", err);
        // — Fallback to cache
        try {
          const cached = localStorage.getItem(`${STORAGE_KEY}_${d}`);
          if (cached) setChartData(JSON.parse(cached));
        } catch {}
      } finally {
        setLoading(false);
      }
    },
    [isMobile]
  );

  // — Lifecycle
  useEffect(() => {
    mountedRef.current = true;
    fetchData(days);

    const interval = setInterval(() => {
      if (mountedRef.current) fetchData(days);
    }, 60000);

    return () => {
      mountedRef.current = false;
      clearInterval(interval);
      controllerRef.current?.abort();
    };
  }, [days, fetchData]);

  // — Dynamic max Y
  const maxY = Math.max(...chartData.map((p) => p.value || 0)) * 1.15;

  // — Chart options
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 800, easing: "easeOutCubic" },
    layout: { padding: { left: 15, right: 15, top: 10, bottom: 0 } },
    plugins: {
      tooltip: {
        mode: "index",
        intersect: false,
        backgroundColor: "rgba(15,15,15,0.92)",
        titleColor: "#fff",
        bodyColor: "#ddd",
        borderColor: "#555",
        borderWidth: 1,
        padding: 10,
        cornerRadius: 8,
        displayColors: false,
        callbacks: {
          title: (items) => chartData[items[0].dataIndex]?.fullLabel || "",
          label: (ctx) => `€ ${ctx.raw.toFixed(2)}`,
        },
      },
      legend: { display: false },
    },
    scales: {
      x: {
        ticks: {
          color: "#bbb",
          font: { size: isMobile ? 10 : 12 },
          padding: 10,
          maxRotation: 45,
          callback: (_, i) => chartData[i]?.shortLabel || "",
        },
        grid: { display: false },
      },
      y: {
        ticks: {
          color: "#bbb",
          font: { size: isMobile ? 10 : 12 },
          padding: 6,
          callback: (v) => `€${v.toFixed(2)}`,
        },
        suggestedMax: maxY,
        grid: { color: "rgba(255,255,255,0.05)" },
      },
    },
    elements: {
      line: { tension: 0.35 },
      point: { radius: isMobile ? 2 : 3 },
    },
  };

  // — Dataset
  const chartDataset = {
    labels: chartData.map((p) => p.shortLabel),
    datasets: [
      {
        data: chartData.map((p) => p.value),
        backgroundColor: (ctx) => {
          const g = ctx.chart.ctx.createLinearGradient(0, 0, 0, 300);
          g.addColorStop(0, "rgba(255,255,255,0.25)");
          g.addColorStop(1, "rgba(255,255,255,0.05)");
          return g;
        },
        borderColor: "#fff",
        borderWidth: 2,
        borderRadius: 6,
        barPercentage: isMobile ? 0.6 : 0.5,
        categoryPercentage: isMobile ? 0.8 : 0.7,
        fill: true,
      },
    ],
  };

  // — Download PNG
  const downloadChart = () => {
    const url = chartRef.current?.toBase64Image();
    if (!url) return;
    const link = document.createElement("a");
    link.href = url;
    link.download = `bnb_chart_${days}d.png`;
    link.click();
  };

  return (
    <div className={styles.chartWrapper}>
      <div className={styles.chartBorder}>
        <div className={styles.chartContainer}>
          {/* Dropdown */}
          <div className={styles.chartDropdownWrapper} ref={dropdownRef}>
            <button
              className={styles.dropdownButton}
              onClick={() => setShowDropdown((v) => !v)}
              aria-label="Select time range"
            >
              {days}D ▾
            </button>
            {showDropdown && (
              <div className={styles.dropdownMenu}>
                {[1, 7, 30].map((d) => (
                  <div
                    key={d}
                    className={styles.dropdownItem}
                    onClick={() => {
                      if (d !== days) setDays(d);
                      setShowDropdown(false);
                    }}
                  >
                    {d}D
                  </div>
                ))}
                <div
                  className={styles.dropdownItem}
                  onClick={() => {
                    setUseBar((v) => !v);
                    setShowDropdown(false);
                  }}
                >
                  {useBar ? "Switch to Line" : "Switch to Bar"}
                </div>
                <div className={styles.dropdownItem} onClick={downloadChart}>
                  Download PNG
                </div>
              </div>
            )}
          </div>

          {/* Chart */}
          {loading || !chartData.length ? (
            <MiniLoadingSpinner />
          ) : useBar ? (
            <Bar
              ref={chartRef}
              data={chartDataset}
              options={chartOptions}
              className={styles.chartCanvas}
            />
          ) : (
            <Line
              ref={chartRef}
              data={chartDataset}
              options={chartOptions}
              className={styles.chartCanvas}
            />
          )}
        </div>
      </div>
    </div>
  );
}

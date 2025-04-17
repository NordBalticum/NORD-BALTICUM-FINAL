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
  const [chartData, setChartData] = useState([]);
  const [chartLoading, setChartLoading] = useState(true);
  const [days, setDays] = useState(7);
  const [showDropdown, setShowDropdown] = useState(false);
  const [useBarChart, setUseBarChart] = useState(true);

  const chartRef = useRef(null);
  const mountedRef = useRef(false);
  const controllerRef = useRef(null);
  const dropdownRef = useRef(null);

  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;

  const fetchChartData = useCallback(async (daysParam = 7) => {
    if (!mountedRef.current || document.visibilityState !== "visible") return;

    try {
      setChartLoading(true);
      controllerRef.current?.abort();
      const controller = new AbortController();
      controllerRef.current = controller;

      const res = await fetch(
        `https://api.coingecko.com/api/v3/coins/binancecoin/market_chart?vs_currency=eur&days=${daysParam}`,
        { signal: controller.signal }
      );

      const data = await res.json();
      if (!data?.prices) throw new Error("No price data");

      const formatted = data.prices.map(([timestamp, price]) => {
        const date = new Date(timestamp);
        const day = date.toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
        });
        const hour = date.toLocaleTimeString("en-GB", {
          hour: "2-digit",
          minute: "2-digit",
        });

        return {
          fullLabel: `${day} ${hour}`,
          shortLabel: day,
          value: parseFloat(price).toFixed(2),
        };
      });

      const pointsPerDay = isMobile ? 2 : 6;
      const step = Math.max(1, Math.ceil(formatted.length / (daysParam * pointsPerDay)));
      const filtered = formatted.filter((_, i) => i % step === 0);

      try {
        localStorage.setItem(`${STORAGE_KEY}_${daysParam}`, JSON.stringify(filtered));
      } catch {}

      setChartData(filtered);
    } catch (err) {
      console.error("Chart fetch error:", err);
      try {
        const cached = localStorage.getItem(`${STORAGE_KEY}_${daysParam}`);
        if (cached) {
          setChartData(JSON.parse(cached));
        }
      } catch {}
    } finally {
      setChartLoading(false);
    }
  }, [isMobile]);

  useEffect(() => {
    mountedRef.current = true;
    fetchChartData(days);

    const interval = setInterval(() => {
      if (document.visibilityState === "visible") fetchChartData(days);
    }, 60000);

    return () => {
      mountedRef.current = false;
      clearInterval(interval);
      controllerRef.current?.abort();
    };
  }, [days, fetchChartData]);

  const maxY = Math.max(...chartData.map((p) => parseFloat(p.value) || 0)) * 1.15;

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 800,
      easing: "easeOutCubic",
    },
    layout: {
      padding: { left: 15, right: 15, top: 10, bottom: 0 },
    },
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
          label: (ctx) => `€ ${parseFloat(ctx.raw).toFixed(2)}`,
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
          callback: (v) => `€${parseFloat(v).toFixed(2)}`,
          padding: 6,
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

  const chartDataset = {
    labels: chartData.map((p) => p.shortLabel),
    datasets: [
      {
        label: "BNB Price",
        data: chartData.map((p) => parseFloat(p.value)),
        backgroundColor: (ctx) => {
          const gradient = ctx?.chart?.ctx?.createLinearGradient?.(0, 0, 0, 300);
          if (gradient) {
            gradient.addColorStop(0, "rgba(255,255,255,0.25)");
            gradient.addColorStop(1, "rgba(255,255,255,0.05)");
            return gradient;
          }
          return "rgba(255,255,255,0.15)";
        },
        borderColor: "#ffffff",
        borderWidth: 2,
        borderRadius: 6,
        barPercentage: isMobile ? 0.6 : 0.5,
        categoryPercentage: isMobile ? 0.8 : 0.7,
        fill: true,
      },
    ],
  };

  const downloadChart = () => {
    if (!chartRef.current) return;
    const url = chartRef.current.toBase64Image();
    const link = document.createElement("a");
    link.href = url;
    link.download = `bnb_chart_${days}d.png`;
    link.click();
  };

  return (
    <div className={styles.chartWrapper}>
      <div className={styles.chartBorder}>
        <div className={styles.chartContainer}>
          <div className={styles.chartDropdownWrapper} ref={dropdownRef}>
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className={styles.dropdownButton}
            >
              {days}D ▾
            </button>

            {showDropdown && (
              <div className={styles.dropdownMenu}>
                {[1, 7, 30].map((d) => (
                  <div
                    key={d}
                    onClick={() => {
                      if (d !== days) {
                        setDays(d);
                      }
                      setShowDropdown(false);
                    }}
                    className={styles.dropdownItem}
                  >
                    {d}D
                  </div>
                ))}
                <div
                  className={styles.dropdownItem}
                  onClick={() => setUseBarChart((v) => !v)}
                >
                  Switch to {useBarChart ? "Line" : "Bar"}
                </div>
                <div
                  className={styles.dropdownItem}
                  onClick={downloadChart}
                >
                  Download PNG
                </div>
              </div>
            )}
          </div>

          {chartLoading || chartData.length === 0 ? (
            <MiniLoadingSpinner />
          ) : useBarChart ? (
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

// BnbChart.js – ULTIMATE SWISS BANK EDITION

"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
  Filler,
  Decimation,
} from "chart.js";
import debounce from "lodash.debounce";

import { useMinimalReady } from "@/hooks/useMinimalReady";
import MiniLoadingSpinner from "@/components/MiniLoadingSpinner";
import styles from "@/styles/tbnb.module.css";

ChartJS.register(
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
  Filler,
  Decimation
);

const STORAGE_KEY = "nb_bnb_chart_7d";

export default function BnbChart() {
  const { ready } = useMinimalReady();

  const [chartData, setChartData] = useState([]);
  const [chartLoading, setChartLoading] = useState(true);
  const [days, setDays] = useState(7);
  const [showDropdown, setShowDropdown] = useState(false);

  const chartRef = useRef(null);
  const mountedRef = useRef(false);
  const controllerRef = useRef(null);
  const resizeTimeout = useRef(null);
  const dropdownRef = useRef(null);

  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;

  const fetchChartData = useCallback(
    debounce(async (daysParam = 7) => {
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
          const day = date.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
          const hour = date.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
          return {
            fullLabel: `${day} ${hour}`,
            shortLabel: day,
            value: parseFloat(price).toFixed(2),
          };
        });

        const pointsPerDay = isMobile ? 3 : 6;
        const step = Math.ceil(formatted.length / (daysParam * pointsPerDay));
        const filtered = formatted.filter((_, i) => i % step === 0);

        localStorage.setItem(STORAGE_KEY, JSON.stringify({ filtered, days: daysParam }));
        setChartData(filtered);
      } catch (err) {
        console.error("Chart fetch error:", err?.message || err);
        const cached = localStorage.getItem(STORAGE_KEY);
        if (cached) {
          const { filtered, days: cachedDays } = JSON.parse(cached);
          setDays(cachedDays);
          setChartData(filtered);
        }
      } finally {
        setChartLoading(false);
      }
    }, 300),
    [isMobile]
  );

  useEffect(() => {
    if (!ready) return;
    mountedRef.current = true;

    const cached = localStorage.getItem(STORAGE_KEY);
    if (cached) {
      const { filtered, days: cachedDays } = JSON.parse(cached);
      setDays(cachedDays);
      setChartData(filtered);
      setChartLoading(false);
    } else {
      fetchChartData(days);
    }

    const hourlyInterval = setInterval(() => {
      if (document.visibilityState === "visible") fetchChartData(days);
    }, 60 * 60 * 1000);

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") fetchChartData(days);
      else controllerRef.current?.abort();
    };

    const handleReconnect = () => fetchChartData(days);

    const handleResize = () => {
      clearTimeout(resizeTimeout.current);
      resizeTimeout.current = setTimeout(() => fetchChartData(days), 600);
    };

    const handleOutsideClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };

    window.addEventListener("focus", handleReconnect);
    window.addEventListener("online", handleReconnect);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("resize", handleResize);
    document.addEventListener("mousedown", handleOutsideClick);

    return () => {
      mountedRef.current = false;
      clearInterval(hourlyInterval);
      controllerRef.current?.abort();

      window.removeEventListener("focus", handleReconnect);
      window.removeEventListener("online", handleReconnect);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("resize", handleResize);
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [ready, days, fetchChartData]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 800,
      easing: "easeOutCubic",
    },
    layout: {
      padding: { left: 15, right: 15, top: 0, bottom: 0 },
    },
    plugins: {
      tooltip: {
        mode: "index",
        intersect: false,
        backgroundColor: "rgba(15,15,15,0.92)",
        titleColor: "#ffffff",
        bodyColor: "#dddddd",
        borderColor: "#555",
        borderWidth: 1,
        padding: 10,
        cornerRadius: 8,
        displayColors: false,
        callbacks: {
          title: (tooltipItems) =>
            chartData[tooltipItems[0].dataIndex]?.fullLabel || "",
          label: (context) => `€ ${parseFloat(context.raw).toFixed(2)}`,
        },
      },
      legend: { display: false },
      decimation: {
        enabled: true,
        algorithm: "lttb",
        samples: isMobile ? 21 : 42,
      },
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
        data: chartData.map((p) => parseFloat(p.value)),
        fill: true,
        backgroundColor: (ctx) => {
          const gradient = ctx.chart.ctx.createLinearGradient(0, 0, 0, 300);
          gradient.addColorStop(0, "rgba(255,255,255,0.3)");
          gradient.addColorStop(1, "rgba(255,255,255,0)");
          return gradient;
        },
        borderColor: "#ffffff",
        borderWidth: 2,
      },
    ],
  };

  return (
    <div className={styles.chartContainer}>
      <div className={styles.chartDropdownWrapper} ref={dropdownRef}>
        <button
          onClick={() => setShowDropdown((prev) => !prev)}
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
                  setDays(d);
                  fetchChartData(d);
                  setShowDropdown(false);
                }}
                className={styles.dropdownItem}
              >
                {d}D
              </div>
            ))}
          </div>
        )}
      </div>

      {!ready || chartLoading || chartData.length === 0 ? (
        <MiniLoadingSpinner />
      ) : (
        <Line
          ref={chartRef}
          data={chartDataset}
          options={chartOptions}
          style={{
            width: "100%",
            height: "100%",
            display: "block",
          }}
        />
      )}
    </div>
  );
}

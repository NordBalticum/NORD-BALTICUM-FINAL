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

import styles from "@/styles/tbnb.module.css";
import MiniLoadingSpinner from "@/components/MiniLoadingSpinner";

ChartJS.register(
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
  Filler,
  Decimation
);

export default function BnbChart({ onChartReady, onMount }) {
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const chartRef = useRef(null);
  const mountedRef = useRef(false);
  const controllerRef = useRef(null);
  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;

  useEffect(() => {
    if (typeof onMount === "function") onMount();
  }, [onMount]);

  const fetchChartData = useCallback(
    debounce(async () => {
      if (!mountedRef.current || document.visibilityState !== "visible") return;

      try {
        controllerRef.current?.abort();
        const controller = new AbortController();
        controllerRef.current = controller;

        const res = await fetch(
          "https://api.coingecko.com/api/v3/coins/binancecoin/market_chart?vs_currency=eur&days=7",
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

        const step = Math.ceil(formatted.length / (isMobile ? 7 : 30));
        const filtered = formatted.filter((_, i) => i % step === 0);

        if (mountedRef.current && filtered.length > 0) {
          setChartData(filtered);
          setLoading(false);
          if (typeof onChartReady === "function") onChartReady();
        }
      } catch (err) {
        if (err.name !== "AbortError") {
          console.error("Chart fetch error:", err.message);
        }
        setLoading(false);
      }
    }, 300),
    [isMobile, onChartReady]
  );

  useEffect(() => {
    mountedRef.current = true;
    fetchChartData();

    const interval = setInterval(() => {
      if (document.visibilityState === "visible") fetchChartData();
    }, 60000); // kas 1min

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        fetchChartData();
      } else {
        controllerRef.current?.abort();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      mountedRef.current = false;
      clearInterval(interval);
      controllerRef.current?.abort();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [fetchChartData]);

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
        samples: isMobile ? 7 : 50,
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

  if (loading) {
    return (
      <div className={styles.chartContainer}>
        <MiniLoadingSpinner />
      </div>
    );
  }

  return (
    <div className={styles.chartContainer}>
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
    </div>
  );
}

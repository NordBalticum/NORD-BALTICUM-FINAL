"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import axios from "axios";
import {
  Chart as ChartJS,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
  Filler,
  TimeScale,
} from "chart.js";
import "chartjs-adapter-date-fns";
import { Line } from "react-chartjs-2";
import styles from "./chart.module.css";

ChartJS.register(
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
  Filler,
  TimeScale
);

// Tik Coingecko palaikomi ID
const networks = [
  { id: "binancecoin", label: "BNB" },
  { id: "ethereum", label: "ETH" },
  { id: "polygon-pos", label: "MATIC" },
  { id: "avalanche-2", label: "AVAX" },
];

const currencies = ["eur", "usd"];
const ranges = [
  { label: "1d", value: 1 },
  { label: "7d", value: 7 },
  { label: "14d", value: 14 },
  { label: "30d", value: 30 },
];

export default function Chart({ token = "bnb", currency = "eur" }) {
  const [selectedToken, setSelectedToken] = useState("binancecoin");
  const [selectedLabel, setSelectedLabel] = useState("BNB");
  const [selectedCurrency, setSelectedCurrency] = useState(currency);
  const [range, setRange] = useState(1);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const intervalRef = useRef(null);

  const fetchChart = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get(
        `https://api.coingecko.com/api/v3/coins/${selectedToken}/market_chart`,
        {
          params: {
            vs_currency: selectedCurrency,
            days: range,
            interval: range === 1 ? "minute" : "daily",
          },
        }
      );

      const prices = res.data.prices;
      if (!prices || !prices.length) {
        throw new Error("No price data available");
      }

      setData({
        labels: prices.map(([timestamp]) => timestamp),
        datasets: [
          {
            label: `${selectedLabel} / ${selectedCurrency.toUpperCase()}`,
            data: prices.map(([, price]) => price),
            fill: true,
            borderColor: "#FFD700",
            backgroundColor: "rgba(255, 215, 0, 0.12)",
            tension: 0.35,
            pointRadius: 0,
          },
        ],
      });
    } catch (err) {
      console.error("❌ Chart fetch error:", err.message);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [selectedToken, selectedCurrency, range, selectedLabel]);

  useEffect(() => {
    fetchChart();
    clearInterval(intervalRef.current);
    intervalRef.current = setInterval(fetchChart, 60000);
    return () => clearInterval(intervalRef.current);
  }, [fetchChart]);

  const handleTokenChange = (e) => {
    const label = e.target.options[e.target.selectedIndex].text;
    setSelectedToken(e.target.value);
    setSelectedLabel(label);
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      tooltip: {
        mode: "index",
        intersect: false,
        backgroundColor: "#0A1F44",
        titleColor: "#FFD700",
        bodyColor: "#fff",
      },
      legend: { display: false },
    },
    scales: {
      x: {
        type: "time",
        time: {
          unit: range === 1 ? "minute" : "day",
          tooltipFormat: "PPp",
        },
        ticks: {
          color: "#fff",
          font: { family: "var(--font-crypto)" },
        },
        grid: { color: "rgba(255,255,255,0.05)" },
      },
      y: {
        ticks: {
          color: "#fff",
          font: { family: "var(--font-crypto)" },
          callback: (val) =>
            `${parseFloat(val).toFixed(2)} ${selectedCurrency.toUpperCase()}`,
        },
        grid: { color: "rgba(255,255,255,0.06)" },
      },
    },
  };

  return (
    <div className={styles.chartWrapper}>
      <div className={styles.controlsRow}>
        <select
          className={styles.selector}
          value={selectedToken}
          onChange={handleTokenChange}
        >
          {networks.map((net) => (
            <option key={net.id} value={net.id}>
              {net.label}
            </option>
          ))}
        </select>

        <select
          className={styles.selector}
          value={selectedCurrency}
          onChange={(e) => setSelectedCurrency(e.target.value)}
        >
          {currencies.map((cur) => (
            <option key={cur} value={cur}>
              {cur.toUpperCase()}
            </option>
          ))}
        </select>

        <div className={styles.rangeButtons}>
          {ranges.map((r) => (
            <button
              key={r.value}
              className={`${styles.rangeButton} ${
                range === r.value ? styles.active : ""
              }`}
              onClick={() => setRange(r.value)}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {loading || !data ? (
        <div className={styles.loadingChart}>Loading chart...</div>
      ) : (
        <Line data={data} options={options} />
      )}
    </div>
  );
      }

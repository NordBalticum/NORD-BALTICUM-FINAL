"use client";

import React, { useEffect, useState, useRef } from "react";
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

const networkMap = {
  bnb: "binancecoin",
  tbnb: "binancecoin",
  eth: "ethereum",
  matic: "polygon",
  avax: "avalanche-2",
};

const ranges = [
  { label: "1d", value: 1 },
  { label: "7d", value: 7 },
  { label: "14d", value: 14 },
  { label: "30d", value: 30 },
];

export default function Chart({ token = "bnb", currency = "eur" }) {
  const [selectedToken, setSelectedToken] = useState(token);
  const [selectedCurrency, setSelectedCurrency] = useState(currency);
  const [range, setRange] = useState(1);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const intervalRef = useRef(null);

  const fetchChart = async () => {
    try {
      setLoading(true);
      const coingeckoId = networkMap[selectedToken];
      const res = await axios.get(
        `https://api.coingecko.com/api/v3/coins/${coingeckoId}/market_chart`,
        {
          params: {
            vs_currency: selectedCurrency,
            days: range,
            interval: range === 1 ? "minute" : "hourly",
          },
        }
      );

      const prices = res.data.prices;

      setData({
        labels: prices.map(([timestamp]) => timestamp),
        datasets: [
          {
            label: `${selectedToken.toUpperCase()} / ${selectedCurrency.toUpperCase()}`,
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
      console.error("Chart error:", err.message);
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChart();
    intervalRef.current = setInterval(fetchChart, 60000);
    return () => clearInterval(intervalRef.current);
  }, [selectedToken, selectedCurrency, range]);

  return (
    <div className={styles.chartWrapper}>
      <div className={styles.controlsRow}>
        <select
          className={styles.selector}
          value={selectedToken}
          onChange={(e) => setSelectedToken(e.target.value)}
        >
          {Object.keys(networkMap).map((key) => (
            <option key={key} value={key}>
              {key.toUpperCase()}
            </option>
          ))}
        </select>

        <select
          className={styles.selector}
          value={selectedCurrency}
          onChange={(e) => setSelectedCurrency(e.target.value)}
        >
          <option value="eur">EUR</option>
          <option value="usd">USD</option>
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
        <Line
          data={data}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              tooltip: {
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
          }}
        />
      )}
    </div>
  );
}

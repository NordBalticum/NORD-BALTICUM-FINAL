"use client";

import React, { useState } from "react";
import styles from "./chart.module.css";

// Coingecko-compatible coins
const coins = [
  { id: "binancecoin", label: "BNB" },
  { id: "ethereum", label: "ETH" },
  { id: "polygon", label: "MATIC" },
  { id: "avalanche-2", label: "AVAX" },
];

const ranges = [
  { label: "1d", value: "1" },
  { label: "7d", value: "7" },
  { label: "14d", value: "14" },
  { label: "30d", value: "30" },
];

export default function ChartIframe() {
  const [selectedCoin, setSelectedCoin] = useState("binancecoin");
  const [selectedRange, setSelectedRange] = useState("1");

  const embedUrl = `https://www.coingecko.com/en/coins/${selectedCoin}?chart_duration=${selectedRange}&embed=true`;

  return (
    <div className={styles.chartWrapper}>
      <div className={styles.controlsRow}>
        <select
          className={styles.selector}
          value={selectedCoin}
          onChange={(e) => setSelectedCoin(e.target.value)}
        >
          {coins.map((coin) => (
            <option key={coin.id} value={coin.id}>
              {coin.label}
            </option>
          ))}
        </select>

        <div className={styles.rangeButtons}>
          {ranges.map((r) => (
            <button
              key={r.value}
              className={`${styles.rangeButton} ${
                selectedRange === r.value ? styles.active : ""
              }`}
              onClick={() => setSelectedRange(r.value)}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <iframe
        src={embedUrl}
        width="100%"
        height="360"
        style={{
          border: "none",
          borderRadius: "16px",
          background: "transparent",
        }}
        title="Live CoinGecko Chart"
        loading="lazy"
      />
    </div>
  );
}

"use client";

import React, { useState } from "react";
import styles from "./chart.module.css";

const tokens = ["bnb", "eth", "matic", "avax"];
const currencies = ["eur", "usd"];
const ranges = ["1", "7", "14", "30"];

export default function ChartIframe() {
  const [selectedToken, setSelectedToken] = useState("bnb");
  const [selectedCurrency, setSelectedCurrency] = useState("eur");
  const [selectedRange, setSelectedRange] = useState("1");

  const url = `https://www.coingecko.com/en/coins/${selectedToken}/eur?chart_duration=${selectedRange}#panel`;

  return (
    <div className={styles.chartWrapper}>
      <div className={styles.controlsRow}>
        <select
          className={styles.selector}
          value={selectedToken}
          onChange={(e) => setSelectedToken(e.target.value)}
        >
          {tokens.map((t) => (
            <option key={t} value={t}>
              {t.toUpperCase()}
            </option>
          ))}
        </select>

        <select
          className={styles.selector}
          value={selectedCurrency}
          onChange={(e) => setSelectedCurrency(e.target.value)}
        >
          {currencies.map((c) => (
            <option key={c} value={c}>
              {c.toUpperCase()}
            </option>
          ))}
        </select>

        <div className={styles.rangeButtons}>
          {ranges.map((r) => (
            <button
              key={r}
              className={`${styles.rangeButton} ${
                selectedRange === r ? styles.active : ""
              }`}
              onClick={() => setSelectedRange(r)}
            >
              {r}d
            </button>
          ))}
        </div>
      </div>

      <iframe
        src={url}
        width="100%"
        height="320"
        style={{
          border: "none",
          borderRadius: "14px",
          overflow: "hidden",
          background: "transparent",
        }}
        loading="lazy"
      />
    </div>
  );
}

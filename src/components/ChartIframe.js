"use client";

import React, { useState } from "react";
import styles from "./chart.module.css";

const tokenOptions = [
  { id: "binancecoin", label: "BNB" },
  { id: "ethereum", label: "ETH" },
  { id: "polygon", label: "MATIC" },
  { id: "avalanche-2", label: "AVAX" },
];

const currencyOptions = ["eur", "usd"];

const rangeOptions = [
  { label: "1d", value: "1" },
  { label: "7d", value: "7" },
  { label: "14d", value: "14" },
  { label: "30d", value: "30" },
];

export default function ChartIframe() {
  const [token, setToken] = useState("binancecoin");
  const [currency, setCurrency] = useState("eur");
  const [range, setRange] = useState("1");

  const src = `https://www.coingecko.com/en/coins/${token}/usd#panel`;

  return (
    <div className={styles.chartWrapper}>
      <div className={styles.controlsRow}>
        <select
          className={styles.selector}
          value={token}
          onChange={(e) => setToken(e.target.value)}
        >
          {tokenOptions.map((t) => (
            <option key={t.id} value={t.id}>
              {t.label}
            </option>
          ))}
        </select>

        <select
          className={styles.selector}
          value={currency}
          onChange={(e) => setCurrency(e.target.value)}
        >
          {currencyOptions.map((cur) => (
            <option key={cur} value={cur}>
              {cur.toUpperCase()}
            </option>
          ))}
        </select>

        <div className={styles.rangeButtons}>
          {rangeOptions.map((r) => (
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

      <iframe
        className={styles.iframe}
        src={`https://www.coingecko.com/en/coins/${token}`}
        loading="lazy"
        title="Chart"
        frameBorder="0"
        style={{
          width: "100%",
          height: "320px",
          borderRadius: "16px",
          backgroundColor: "transparent",
          overflow: "hidden",
        }}
      />
    </div>
  );
}

"use client";

import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import axios from "axios";
import styles from "./chart.module.css"; // <— Importas iš komponento stiliaus

const ApexChart = dynamic(() => import("react-apexcharts"), { ssr: false });

export default function Chart({ token = "bnb", currency = "eur" }) {
  const [chartData, setChartData] = useState({ series: [], options: {} });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const { data } = await axios.get(
          `https://api.coingecko.com/api/v3/coins/${token}/market_chart`,
          {
            params: {
              vs_currency: currency,
              days: 1,
              interval: "minute",
            },
          }
        );

        const prices = data.prices.map(([timestamp, price]) => ({
          x: new Date(timestamp),
          y: parseFloat(price.toFixed(4)),
        }));

        setChartData({
          series: [
            {
              name: `${token.toUpperCase()} Price`,
              data: prices,
            },
          ],
          options: {
            chart: {
              type: "area",
              height: 320,
              toolbar: { show: false },
              zoom: { enabled: false },
              animations: {
                enabled: true,
                easing: "easeinout",
                speed: 800,
              },
            },
            dataLabels: { enabled: false },
            stroke: {
              curve: "smooth",
              width: 3,
              colors: ["#FFD700"],
            },
            fill: {
              type: "gradient",
              gradient: {
                shadeIntensity: 1,
                opacityFrom: 0.35,
                opacityTo: 0,
                stops: [0, 90, 100],
                colorStops: [
                  { offset: 0, color: "#FFD700", opacity: 0.3 },
                  { offset: 100, color: "#0A1F44", opacity: 0 },
                ],
              },
            },
            xaxis: {
              type: "datetime",
              labels: {
                style: {
                  colors: "#ffffff",
                  fontFamily: "var(--font-crypto)",
                },
              },
            },
            yaxis: {
              labels: {
                formatter: (val) => `${val} ${currency.toUpperCase()}`,
                style: {
                  colors: "#ffffff",
                  fontFamily: "var(--font-crypto)",
                },
              },
            },
            tooltip: {
              theme: "dark",
              x: { format: "HH:mm" },
            },
            grid: {
              borderColor: "rgba(255,255,255,0.06)",
              strokeDashArray: 4,
            },
          },
        });
      } catch (err) {
        console.error("❌ Chart fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token, currency]);

  if (loading || chartData.series.length === 0) {
    return (
      <div className={styles.loadingChart}>
        Loading chart...
      </div>
    );
  }

  return (
    <div className={styles.chartWrapper}>
      <ApexChart
        options={chartData.options}
        series={chartData.series}
        type="area"
        height={320}
      />
    </div>
  );
}

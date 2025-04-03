"use client";

import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import styles from "./livepricetable.module.css";

const tokens = [
  {
    id: "binancecoin",
    symbol: "BNB",
    logo: "https://cryptologos.cc/logos/binance-coin-bnb-logo.png",
    route: "/bnb",
  },
  {
    id: "ethereum",
    symbol: "ETH",
    logo: "https://cryptologos.cc/logos/ethereum-eth-logo.png",
    route: "/eth",
  },
  {
    id: "matic-network",
    symbol: "MATIC",
    logo: "https://cryptologos.cc/logos/polygon-matic-logo.png",
    route: "/matic",
  },
  {
    id: "avalanche-2",
    symbol: "AVAX",
    logo: "https://cryptologos.cc/logos/avalanche-avax-logo.png",
    route: "/avax",
  },
];

const currencies = ["eur", "usd"];

export default function LivePriceTable() {
  const [prices, setPrices] = useState({});
  const [currency, setCurrency] = useState("eur");
  const intervalRef = useRef(null);
  const mountedRef = useRef(false);
  const router = useRouter();

  const fetchPrices = async () => {
    if (!navigator.onLine || !mountedRef.current) return;

    try {
      const ids = tokens.map((t) => t.id).join(",");
      const res = await axios.get("https://api.coingecko.com/api/v3/simple/price", {
        params: {
          ids,
          vs_currencies: currencies.join(","),
        },
        timeout: 10000,
      });

      if (mountedRef.current) {
        setPrices(res.data);
      }
    } catch (err) {
      console.error("CoinGecko price fetch failed:", err.message);
    }
  };

  useEffect(() => {
    mountedRef.current = true;
    fetchPrices();
    intervalRef.current = setInterval(fetchPrices, 30000);

    const onVisibility = () => {
      if (document.visibilityState === "visible") fetchPrices();
    };

    const onResizeOrOrientation = () => {
      fetchPrices();
    };

    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("resize", onResizeOrOrientation);
    window.addEventListener("orientationchange", onResizeOrOrientation);

    return () => {
      mountedRef.current = false;
      clearInterval(intervalRef.current);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("resize", onResizeOrOrientation);
      window.removeEventListener("orientationchange", onResizeOrOrientation);
    };
  }, []);

  return (
    <div className={styles.wrapper}>
      <div className={styles.controls}>
        {currencies.map((cur) => (
          <button
            key={cur}
            className={`${styles.currencyButton} ${currency === cur ? styles.active : ""}`}
            onClick={() => setCurrency(cur)}
          >
            {cur.toUpperCase()}
          </button>
        ))}
      </div>

      <div className={styles.grid}>
        {tokens.map((token) => (
          <div
            key={token.id}
            className={styles.card}
            onClick={() => router.push(token.route)}
          >
            <img src={token.logo} alt={token.symbol} className={styles.logo} />
            <div className={styles.symbol}>{token.symbol}</div>
            <div className={styles.price}>
              {prices[token.id]?.[currency]
                ? `${currency === "eur" ? "€" : "$"}${prices[token.id][currency].toFixed(2)}`
                : "Loading..."}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

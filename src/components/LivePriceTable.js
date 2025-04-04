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
const LOCAL_CACHE_KEY = "livePriceCache";

export default function LivePriceTable() {
  const [prices, setPrices] = useState({});
  const [currency, setCurrency] = useState("eur");
  const [loading, setLoading] = useState(true);
  const intervalRef = useRef(null);
  const mountedRef = useRef(false);
  const router = useRouter();

  const fetchPrices = async () => {
    if (!mountedRef.current || !navigator.onLine) return;

    try {
      const ids = tokens.map((t) => t.id).join(",");
      const res = await axios.get("https://api.coingecko.com/api/v3/simple/price", {
        params: { ids, vs_currencies: currencies.join(",") },
        timeout: 10000,
      });

      if (mountedRef.current) {
        setPrices(res.data);
        localStorage.setItem(LOCAL_CACHE_KEY, JSON.stringify(res.data));
        setLoading(false);
      }
    } catch (err) {
      console.warn("CoinGecko price fetch failed:", err.message);
    }
  };

  const loadFromCache = () => {
    const cached = localStorage.getItem(LOCAL_CACHE_KEY);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (typeof parsed === "object") {
          setPrices(parsed);
        }
      } catch (e) {
        console.error("Failed to parse cached prices");
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    mountedRef.current = true;

    loadFromCache(); // Failover
    fetchPrices(); // Fresh fetch

    intervalRef.current = setInterval(fetchPrices, 30000);

    const handleVisibility = () => document.visibilityState === "visible" && fetchPrices();
    const handleUserEvent = () => fetchPrices();
    const handleOnline = () => fetchPrices();

    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("resize", handleUserEvent);
    window.addEventListener("orientationchange", handleUserEvent);
    window.addEventListener("pageshow", handleUserEvent);
    window.addEventListener("online", handleOnline);

    return () => {
      mountedRef.current = false;
      clearInterval(intervalRef.current);
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("resize", handleUserEvent);
      window.removeEventListener("orientationchange", handleUserEvent);
      window.removeEventListener("pageshow", handleUserEvent);
      window.removeEventListener("online", handleOnline);
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
        {tokens.map((token) => {
          const price = prices?.[token.id]?.[currency];

          return (
            <div
              key={token.id}
              className={styles.card}
              onClick={() => router.push(token.route)}
            >
              <img src={token.logo} alt={token.symbol} className={styles.logo} />
              <div className={styles.symbol}>{token.symbol}</div>
              <div className={styles.price}>
                {price !== undefined
                  ? `${currency === "eur" ? "€" : "$"}${price.toFixed(2)}`
                  : loading
                  ? "Loading..."
                  : "—"}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

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
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);
  const [prices, setPrices] = useState({});
  const [currency, setCurrency] = useState("eur");
  const [loading, setLoading] = useState(true);
  const intervalRef = useRef(null);
  const mountedRef = useRef(false);

  const fetchPrices = async () => {
    if (!mountedRef.current) return;

    try {
      const ids = tokens.map((t) => t.id).join(",");
      const res = await axios.get("https://api.coingecko.com/api/v3/simple/price", {
        params: { ids, vs_currencies: currencies.join(",") },
        timeout: 10000,
      });

      if (mountedRef.current) {
        setPrices(res.data);
        if (typeof window !== "undefined") {
          localStorage.setItem(LOCAL_CACHE_KEY, JSON.stringify(res.data));
        }
        setLoading(false);
      }
    } catch (err) {
      console.warn("CoinGecko fetch failed:", err.message);
    }
  };

  const loadFromCache = () => {
    if (typeof window === "undefined") return;

    const cached = window.localStorage.getItem(LOCAL_CACHE_KEY);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (typeof parsed === "object") {
          setPrices(parsed);
        }
      } catch (e) {
        console.error("Failed to parse cached prices:", e);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsClient(true);
    }
  }, []);

  useEffect(() => {
    if (!isClient) return;

    mountedRef.current = true;

    loadFromCache();
    fetchPrices();

    intervalRef.current = setInterval(fetchPrices, 30000);

    const handleVisibility = () => {
      if (document.visibilityState === "visible") fetchPrices();
    };

    const handleUserEvent = () => fetchPrices();
    const handleOnline = () => fetchPrices();

    if (typeof document !== "undefined") {
      document.addEventListener("visibilitychange", handleVisibility);
    }
    if (typeof window !== "undefined") {
      window.addEventListener("resize", handleUserEvent);
      window.addEventListener("orientationchange", handleUserEvent);
      window.addEventListener("pageshow", handleUserEvent);
      window.addEventListener("online", handleOnline);
    }

    return () => {
      mountedRef.current = false;
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (typeof document !== "undefined") {
        document.removeEventListener("visibilitychange", handleVisibility);
      }
      if (typeof window !== "undefined") {
        window.removeEventListener("resize", handleUserEvent);
        window.removeEventListener("orientationchange", handleUserEvent);
        window.removeEventListener("pageshow", handleUserEvent);
        window.removeEventListener("online", handleOnline);
      }
    };
  }, [isClient]);

  if (!isClient) {
    return <div className={styles.loading}>Loading prices...</div>;
  }

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

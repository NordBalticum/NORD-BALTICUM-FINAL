"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import axios from "axios";
import styles from "./livepricetable.module.css";

const tokens = [
  { id: "binancecoin", symbol: "BNB", logo: "https://cryptologos.cc/logos/binance-coin-bnb-logo.png", route: "/bnb" },
  { id: "ethereum", symbol: "ETH", logo: "https://cryptologos.cc/logos/ethereum-eth-logo.png", route: "/eth" },
  { id: "matic-network", symbol: "MATIC", logo: "https://cryptologos.cc/logos/polygon-matic-logo.png", route: "/matic" },
  { id: "avalanche-2", symbol: "AVAX", logo: "https://cryptologos.cc/logos/avalanche-avax-logo.png", route: "/avax" },
];

const currencies = ["eur", "usd"];
const LOCAL_CACHE_KEY = "livePriceCache";

export default function LivePriceTable() {
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);
  const [prices, setPrices] = useState({});
  const [currency, setCurrency] = useState("eur");
  const [loading, setLoading] = useState(true);
  const [updatedToken, setUpdatedToken] = useState(null);
  const mountedRef = useRef(false);
  const intervalRef = useRef(null);

  const fetchPrices = async () => {
    if (!mountedRef.current) return;

    try {
      const ids = tokens.map((t) => t.id).join(",");
      const res = await axios.get("https://api.coingecko.com/api/v3/simple/price", {
        params: { ids, vs_currencies: currencies.join(",") },
        timeout: 10000,
      });

      if (mountedRef.current && res.data) {
        const newPrices = res.data;
        const priceChange = Object.keys(newPrices).find(id => 
          prices[id]?.[currency] !== newPrices[id][currency]
        );
        if (priceChange) {
          setUpdatedToken(priceChange);
          setTimeout(() => setUpdatedToken(null), 1000); // Žalias flash 1s
        }
        setPrices(newPrices);
        if (typeof window !== "undefined") {
          localStorage.setItem(LOCAL_CACHE_KEY, JSON.stringify(newPrices));
        }
        setLoading(false);
      }
    } catch (err) {
      console.warn("CoinGecko fetch failed:", err.message);
    }
  };

  const loadFromCache = () => {
    if (typeof window === "undefined") return;
    const cached = localStorage.getItem(LOCAL_CACHE_KEY);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (typeof parsed === "object") setPrices(parsed);
      } catch (err) {
        console.error("Failed to parse cached prices:", err);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    if (typeof window !== "undefined") setIsClient(true);
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

    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("online", fetchPrices);

    return () => {
      mountedRef.current = false;
      clearInterval(intervalRef.current);
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("online", fetchPrices);
    };
  }, [isClient]);

  const handleCardClick = (route) => {
    if (navigator.vibrate) {
      navigator.vibrate(10); // ✅ Vibracija!
    }
    router.push(route);
  };

  if (!isClient) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner}></div> Loading prices...
      </div>
    );
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
              onClick={() => handleCardClick(token.route)}
            >
              <Image
                src={token.logo}
                alt={token.symbol}
                width={48}
                height={48}
                className={styles.logo}
                unoptimized
                priority
              />
              <div className={styles.symbol}>{token.symbol}</div>
              <div className={`${styles.price} ${updatedToken === token.id ? styles.updated : ""}`}>
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

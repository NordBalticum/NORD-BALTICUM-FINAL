"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import styles from "./livepricetable.module.css";

const tokens = [
  { id: "binancecoin", cmc: "BNB", symbol: "BNB", logo: "https://cryptologos.cc/logos/binance-coin-bnb-logo.png", route: "/bnb" },
  { id: "ethereum", cmc: "ETH", symbol: "ETH", logo: "https://cryptologos.cc/logos/ethereum-eth-logo.png", route: "/eth" },
  { id: "polygon_pos", cmc: "MATIC", symbol: "MATIC", logo: "https://cryptologos.cc/logos/polygon-matic-logo.png", route: "/matic" },
  { id: "avalanche-2", cmc: "AVAX", symbol: "AVAX", logo: "https://cryptologos.cc/logos/avalanche-avax-logo.png", route: "/avax" },
];

const currencies = ["eur", "usd"];

export default function LivePriceTable() {
  const [prices, setPrices] = useState({});
  const [currency, setCurrency] = useState("eur");
  const intervalRef = useRef(null);
  const router = useRouter();

  const fetchFromCoingecko = async () => {
    const ids = tokens.map(t => t.id).join(",");
    const res = await axios.get("https://api.coingecko.com/api/v3/simple/price", {
      params: { ids, vs_currencies: currencies.join(",") },
      timeout: 8000
    });
    return res.data;
  };

  const fetchFromCMC = async () => {
    const symbolMap = tokens.map(t => t.cmc).join(",");
    const res = await axios.get("https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest", {
      params: { symbol: symbolMap, convert: currencies.join(",") },
      headers: { "X-CMC_PRO_API_KEY": process.env.NEXT_PUBLIC_CMC_API_KEY },
      timeout: 8000
    });
    const cmcData = res.data.data;

    const parsed = {};
    for (const token of tokens) {
      const info = cmcData[token.cmc];
      if (info) {
        parsed[token.id] = {
          eur: info.quote.EUR?.price ?? null,
          usd: info.quote.USD?.price ?? null,
        };
      }
    }
    return parsed;
  };

  const fetchPrices = useCallback(async () => {
    if (!navigator.onLine) return;

    let finalPrices = {};

    try {
      const coingeckoData = await fetchFromCoingecko();

      for (const token of tokens) {
        const cg = coingeckoData[token.id];
        if (cg && cg[currency]) {
          finalPrices[token.id] = cg;
        }
      }

      const missing = tokens.filter(t => !finalPrices[t.id]);
      if (missing.length > 0) {
        const cmcData = await fetchFromCMC();
        for (const token of missing) {
          if (cmcData[token.id]) {
            finalPrices[token.id] = cmcData[token.id];
          }
        }
      }

      setPrices(finalPrices);
    } catch (err) {
      console.error("Price fetch failed:", err.message);
    }
  }, [currency]);

  useEffect(() => {
    fetchPrices();
    intervalRef.current = setInterval(fetchPrices, 30000);

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        fetchPrices();
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      clearInterval(intervalRef.current);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [fetchPrices]);

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

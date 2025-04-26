// src/components/BalanceCard.js
"use client";

import { useState, useMemo, useEffect } from "react";
import Image from "next/image";
import { useBalance } from "@/contexts/BalanceContext";
import styles from "./balancecard.module.css";
import networks from "@/data/networks";

// ---- NEWS FETCH HOOK (inside this file for brevity) ----
function useCryptoNews() {
  const CACHE_KEY = "nordbalticum_crypto_news";
  const TTL = 5 * 60 * 1000; // 5m
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const lastFetch = useMemo(() => ({ ts: 0 }), []);

  useEffect(() => {
    const now = Date.now();
    const cache = JSON.parse(localStorage.getItem(CACHE_KEY) || "null");
    if (cache && now - cache.ts < TTL) {
      setArticles(cache.articles);
      setLoading(false);
      return;
    }
    const fetchNews = async () => {
      setLoading(true);
      try {
        // your own Next.js proxy at /api/news pulling from a crypto-news API
        const res = await fetch("/api/news?category=crypto", { cache: "no-store" });
        const json = await res.json();
        const top5 = json.articles.slice(0, 5);
        setArticles(top5);
        localStorage.setItem(CACHE_KEY, JSON.stringify({ ts: now, articles: top5 }));
      } catch {
        // swallow errors
      } finally {
        setLoading(false);
      }
    };
    fetchNews();
  }, [lastFetch]);

  return { articles, loading };
}

// ---- BALANCE CARD COMPONENT ----
export default function BalanceCard() {
  const { balances, loading: balLoading, getUsdBalance, getEurBalance } = useBalance();
  const { articles, loading: newsLoading } = useCryptoNews();
  const [showTestnets, setShowTestnets] = useState(false);

  // pick mainnets or testnets
  const items = useMemo(
    () =>
      networks
        .map((n) => (showTestnets && n.testnet ? n.testnet : n))
        .filter(Boolean),
    [showTestnets]
  );

  // formatters
  const fmtCrypto = (n) =>
    Number(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 });
  const fmtFiat = (n) =>
    Number(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  // totals
  const { totalUsd, totalEur } = useMemo(() => {
    const u = items.reduce((sum, net) => sum + parseFloat(getUsdBalance(net.value)), 0);
    const e = items.reduce((sum, net) => sum + parseFloat(getEurBalance(net.value)), 0);
    return { totalUsd: u, totalEur: e };
  }, [items, getUsdBalance, getEurBalance]);

  return (
    <div className={styles.cardWrapper}>
      {/* ─── Tabs ────────────────────────────────────── */}
      <div role="tablist" className={styles.toggleWrapper}>
        {["Mainnets", "Testnets"].map((label, i) => {
          const sel = i === 1;
          return (
            <button
              key={label}
              role="tab"
              aria-selected={showTestnets === sel}
              onClick={() => setShowTestnets(sel)}
              className={`${styles.toggleButton} ${showTestnets === sel ? styles.active : ""}`}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* ─── Balances List ───────────────────────────── */}
      <div className={styles.list}>
        {items.map((net) => {
          const bal = balances[net.value] ?? 0;
          const usd = getUsdBalance(net.value);
          const eur = getEurBalance(net.value);
          return (
            <div key={net.value} className={styles.listItem}>
              <div className={styles.networkInfo}>
                <Image src={net.icon} alt={`${net.label} icon`} width={32} height={32} unoptimized />
                <span className={styles.networkLabel}>{net.label}</span>
              </div>
              <div className={styles.amountInfo}>
                <div className={styles.cryptoAmount}>{fmtCrypto(bal)}</div>
                <div className={styles.fiatAmount}>
                  {balLoading ? (
                    <span className={styles.shimmerTextSmall} />
                  ) : Number(usd) || Number(eur) ? (
                    <>≈ ${fmtFiat(usd)} | €{fmtFiat(eur)}</>
                  ) : (
                    <>–</>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {/* ─── Total Row ────────────────────────────────── */}
        <div className={`${styles.listItem} ${styles.totalRow}`}>
          <div className={styles.networkInfo}>
            <span className={styles.networkLabel}>Total</span>
          </div>
          <div className={styles.amountInfo}>
            <div className={styles.cryptoAmount} />
            <div className={styles.fiatAmount}>
              {balLoading ? (
                <span className={styles.shimmerTextSmall} />
              ) : (
                <>≈ ${fmtFiat(totalUsd)} | €{fmtFiat(totalEur)}</>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ─── Crypto News Pane ────────────────────────── */}
      <div className={styles.newsSection}>
        <h3 className={styles.newsTitle}>Latest Crypto News</h3>
        {newsLoading ? (
          <div className={styles.newsLoading}>Loading news…</div>
        ) : (
          <ul className={styles.newsList}>
            {articles.map((a, i) => (
              <li key={i} className={styles.newsItem}>
                <a href={a.url} target="_blank" rel="noopener">
                  {a.title}
                </a>
                <small>{new Date(a.publishedAt).toLocaleDateString()}</small>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

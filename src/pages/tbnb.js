"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

import { useMagicLink } from "@/contexts/MagicLinkContext";
import { supabase } from "@/lib/supabase";
import { getWalletBalance } from "@/lib/ethers";
import { fetchPrices } from "@/utils/fetchPrices";

import StarsBackground from "@/components/StarsBackground";
import background from "@/styles/background.module.css";
import styles from "@/styles/network.module.css";

export default function TBNBPage() {
  const router = useRouter();
  const { user, wallet } = useMagicLink();

  const [balance, setBalance] = useState("0.00000");
  const [eur, setEur] = useState("0.00");
  const [latestTx, setLatestTx] = useState(null);

  useEffect(() => {
    if (!user || !wallet?.address) {
      router.push("/");
      return;
    }

    const loadBalance = async () => {
      try {
        const { formatted } = await getWalletBalance(wallet.address, "tbnb");
        const prices = await fetchPrices();
        const price = prices?.TBNB || 0;
        const eurValue = (parseFloat(formatted) * price).toFixed(2);

        setBalance(formatted);
        setEur(eurValue);
      } catch (err) {
        console.error("❌ Failed to fetch balance:", err.message);
      }
    };

    const fetchLastTx = async () => {
      try {
        const { data, error } = await supabase
          .from("transactions")
          .select("*")
          .eq("network", "TBNB")
          .eq("sender_email", user.email)
          .order("created_at", { ascending: false })
          .limit(1);

        if (error) throw error;
        if (data?.length > 0) {
          const tx = data[0];
          setLatestTx({
            to: truncate(tx.receiver),
            amount: parseFloat(tx.amount).toFixed(5),
            hash: truncate(tx.tx_hash, 10),
            status: tx.status,
          });
        }
      } catch (err) {
        console.error("❌ Failed to fetch latest transaction:", err.message);
      }
    };

    loadBalance();
    fetchLastTx();
  }, [user, wallet]);

  return (
    <main className={`${styles.container} ${background.gradient}`}>
      <StarsBackground />

      <div className={styles.wrapper}>
        <h1 className={styles.title}>BSC Testnet (TBNB)</h1>

        <div className={styles.chartSection}>
          <iframe
            className={styles.chartFrame}
            src="https://www.tradingview.com/widgetembed/?frameElementId=tradingview_12345&symbol=BINANCE:BNBUSDT&interval=15&theme=dark&style=1&locale=en"
            frameBorder="0"
            allowTransparency="true"
            scrolling="no"
          />
        </div>

        <div className={styles.balanceCard}>
          <div className={styles.assetLeft}>
            <Image
              src="https://cryptologos.cc/logos/binance-coin-bnb-logo.png"
              alt="TBNB Logo"
              width={42}
              height={42}
              className={styles.assetLogo}
              unoptimized
            />
            <div className={styles.assetInfo}>
              <span className={styles.assetSymbol}>TBNB</span>
              <span className={styles.assetName}>BNB Smart Chain Testnet</span>
            </div>
          </div>

          <div className={styles.assetRight}>
            <span className={styles.assetAmount}>{balance} TBNB</span>
            <span className={styles.assetEur}>~€ {eur}</span>
          </div>
        </div>

        <div className={styles.buttonRow}>
          <button className={styles.sendBtn} onClick={() => router.push("/send")}>
            SEND
          </button>
          <button className={styles.receiveBtn} onClick={() => router.push("/receive")}>
            RECEIVE
          </button>
        </div>

        <div className={styles.txSection}>
          <h2 className={styles.txTitle}>Last Transaction</h2>
          {latestTx ? (
            <div className={styles.txBox}>
              <p><strong>To:</strong> {latestTx.to}</p>
              <p><strong>Amount:</strong> {latestTx.amount} TBNB</p>
              <p><strong>Status:</strong> {latestTx.status}</p>
              <p><strong>Hash:</strong> {latestTx.hash}</p>
            </div>
          ) : (
            <div className={styles.txBox}>No recent transaction</div>
          )}
        </div>
      </div>
    </main>
  );
}

// === Helper funkcija adresui trumpinti
function truncate(str, len = 6) {
  if (!str || str.length <= len * 2) return str;
  return `${str.slice(0, len)}...${str.slice(-len)}`;
}

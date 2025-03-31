"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useMagicLink } from "@/contexts/MagicLinkContext";
import { useWallet } from "@/contexts/WalletContext";
import { useBalance } from "@/contexts/BalanceContext";
import { supabase } from "@/lib/supabase";

import StarsBackground from "@/components/StarsBackground";
import background from "@/styles/background.module.css";
import styles from "@/styles/network.module.css";

export default function TBNBPage() {
  const router = useRouter();
  const { user } = useMagicLink();
  const { wallet } = useWallet();
  const { balances } = useBalance();

  const [latestTx, setLatestTx] = useState(null);

  const tbnbBalance = balances?.TBNB || { amount: "0.00000", eur: "0.00" };

  useEffect(() => {
    if (!user || !wallet?.address) return;
    const fetchLastTx = async () => {
      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .eq("network", "TBNB")
        .eq("sender_email", user.email)
        .order("created_at", { ascending: false })
        .limit(1);
      if (!error && data?.length > 0) {
        const tx = data[0];
        setLatestTx({
          to: tx.receiver?.slice(0, 6) + "..." + tx.receiver?.slice(-4),
          amount: parseFloat(tx.amount).toFixed(5),
          hash: tx.tx_hash?.slice(0, 8) + "..." + tx.tx_hash?.slice(-4),
          status: tx.status,
        });
      }
    };
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
          ></iframe>
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
            <span className={styles.assetAmount}>{tbnbBalance.amount} TBNB</span>
            <span className={styles.assetEur}>~€ {tbnbBalance.eur}</span>
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

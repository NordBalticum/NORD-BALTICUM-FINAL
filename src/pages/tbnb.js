"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

import { useMagicLink } from "@/contexts/MagicLinkContext";
import { getWalletBalance } from "@/lib/ethers.js";
import { fetchPrices } from "@/utils/fetchPrices";

import background from "@/styles/background.module.css";
import styles from "@/styles/network.module.css";

export default function TBNBPage() {
  const router = useRouter();
  const { user, publicKey } = useMagicLink();

  const [balance, setBalance] = useState("0.00000");
  const [eur, setEur] = useState("0.00");
  const [latestTx, setLatestTx] = useState(null);

  useEffect(() => {
    if (!user?.email || !publicKey) {
      router.push("/");
      return;
    }

    const loadBalance = async () => {
      try {
        const { formatted } = await getWalletBalance(publicKey, "tbnb");
        const prices = await fetchPrices();
        const price = prices?.TBNB || prices?.BNB || 0;
        const eurValue = (parseFloat(formatted) * price).toFixed(2);

        setBalance(formatted);
        setEur(eurValue);
      } catch (err) {
        console.error("Failed to fetch balance:", err.message);
      }
    };

    const fetchLastTx = async () => {
      try {
        const response = await fetch(`/api/transactions?network=tbnb&email=${user.email}`);
        const { transactions } = await response.json();

        if (transactions?.length) {
          const tx = transactions[0];
          setLatestTx({
            to: truncate(tx.to_address, 10),
            amount: parseFloat(tx.amount).toFixed(5),
            status: tx.status || "success",
          });
        }
      } catch (err) {
        console.error("Failed to fetch latest transaction:", err.message);
      }
    };

    loadBalance();
    fetchLastTx();
  }, [user, publicKey, router]);

  return (
    <main className={`${styles.container} ${background.gradient}`}>
      <div className={styles.wrapper}>
        <h1 className={styles.title}>BSC Testnet (TBNB)</h1>

        <div className={styles.balanceCard}>
          <div className={styles.assetLeft}>
            <Image
              src="https://cryptologos.cc/logos/binance-coin-bnb-logo.png"
              alt="TBNB Logo"
              width={42}
              height={42}
              className={styles.assetLogo}
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

        <div className={styles.txSection}>
          <h2 className={styles.txTitle}>Last Transaction</h2>
          {latestTx ? (
            <div className={styles.txBox}>
              <p><strong>To:</strong> {latestTx.to}</p>
              <p><strong>Amount:</strong> {latestTx.amount} TBNB</p>
              <p><strong>Status:</strong> {latestTx.status}</p>
            </div>
          ) : (
            <div className={styles.txBox}>No recent transaction</div>
          )}
        </div>
      </div>
    </main>
  );
}

// Helper function to truncate strings
function truncate(str, len = 6) {
  if (!str || str.length <= len * 2) return str;
  return `${str.slice(0, len)}...${str.slice(-len)}`;
}

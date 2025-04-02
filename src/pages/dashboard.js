"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useMagicLink } from "@/contexts/MagicLinkContext";
import styles from "@/styles/dashboard.module.css";
import background from "@/styles/background.module.css";

const networkLogos = {
  bsc: "https://cryptologos.cc/logos/bnb-bnb-logo.png",
  tbnb: "https://cryptologos.cc/logos/binance-coin-bnb-logo.png",
  ethereum: "https://cryptologos.cc/logos/ethereum-eth-logo.png",
  polygon: "https://cryptologos.cc/logos/polygon-matic-logo.png",
  avalanche: "https://cryptologos.cc/logos/avalanche-avax-logo.png",
};

const networkNames = {
  bsc: "BNB Smart Chain",
  tbnb: "BSC Testnet",
  ethereum: "Ethereum",
  polygon: "Polygon",
  avalanche: "Avalanche",
};

export default function Dashboard() {
  const router = useRouter();
  const { user, fetchBalances } = useMagicLink();

  const [balances, setBalances] = useState([]);
  const [totalEUR, setTotalEUR] = useState("0.00");

  useEffect(() => {
    if (user) {
      fetchBalances()
        .then((data) => {
          setBalances(data);
          const total = data.reduce((acc, bal) => acc + parseFloat(bal.eur || 0), 0);
          setTotalEUR(total.toFixed(2));
        })
        .catch((err) => console.error("Error fetching balances:", err));
    } else {
      router.replace("/");
    }
  }, [user, fetchBalances, router]);

  const handleCardClick = (symbol) => {
    router.push(`/network/${symbol}`);
  };

  if (!user) {
    return <div className={styles.loading}>Loading Wallet...</div>;
  }

  return (
    <main className={`${styles.container} ${background.gradient}`}>
      <div className={styles.globalWrapper}>
        <header className={styles.header}>
          <Image
            src="/icons/logo.svg"
            alt="NordBalticum"
            width={160}
            height={60}
            className={styles.logo}
            priority
          />
        </header>

        <section className={styles.totalBalance}>
          <p className={styles.totalLabel}>Total Wallet Value</p>
          <h2 className={styles.totalValue}>€ {totalEUR}</h2>
        </section>

        <section className={styles.networkGrid}>
          {balances.map((bal) => (
            <div
              key={bal.network}
              className={styles.networkCard}
              onClick={() => handleCardClick(bal.network)}
            >
              <div className={styles.networkDetails}>
                <Image
                  src={networkLogos[bal.network]}
                  alt={`${bal.network} logo`}
                  width={42}
                  height={42}
                  className={styles.networkLogo}
                />
                <div>
                  <h3 className={styles.networkName}>{networkNames[bal.network]}</h3>
                  <p className={styles.networkBalance}>{parseFloat(bal.amount).toFixed(4)} {bal.network.toUpperCase()}</p>
                  <p className={styles.networkValue}>€ {parseFloat(bal.eur).toFixed(2)}</p>
                </div>
              </div>
              <button className={styles.viewButton}>View Details</button>
            </div>
          ))}
        </section>
      </div>
    </main>
  );
}

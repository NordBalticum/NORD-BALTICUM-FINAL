"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

import { useSystem } from "@/contexts/SystemContext";
import StarsBackground from "@/components/StarsBackground";

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
  const {
    user,
    wallet,
    loading,
    totalEUR,
    refreshAllBalances,
    activeNetwork,
    setActiveNetwork,
  } = useSystem();

  const [balances, setBalances] = React.useState([]);

  useEffect(() => {
    if (!user || !wallet) {
      router.replace("/");
    } else {
      fetchLatest();
    }
  }, [user, wallet]);

  const fetchLatest = async () => {
    try {
      const { data, error } = await supabase
        .from("balances")
        .select("*")
        .eq("email", user.email);

      if (!error && data) setBalances(data);
    } catch (err) {
      console.error("❌ Failed to load balances:", err.message);
    }
  };

  const networkRoutes = {
  bsc: "/bnb",
  tbnb: "/tbnb",
  ethereum: "/eth",
  polygon: "/matic",
  avalanche: "/avax",
};

const handleCardClick = (symbol) => {
  setActiveNetwork(symbol);
  router.push(networkRoutes[symbol] || "/send");
};

  if (!user || !wallet || loading) {
    return <div className={styles.loading}>Loading Wallet...</div>;
  }

  return (
    <main className={`${styles.container} ${background.gradient}`}>
      <StarsBackground />

      <div className={styles.globalWrapper}>
        <div className={styles.header}>
          <Image
            src="/icons/logo.svg"
            alt="NordBalticum"
            width={160}
            height={60}
            className={styles.logo}
            priority
          />
        </div>

        <div className={styles.totalBox}>
          <p className={styles.totalLabel}>Total Wallet Value</p>
          <h2 className={styles.totalValue}>€ {totalEUR}</h2>
        </div>

        <div className={styles.assetGrid}>
          {balances.map((bal) => (
            <div
              key={bal.network}
              className={styles.assetCard}
              onClick={() => handleCardClick(bal.network)}
            >
              <div className={styles.assetLeft}>
                <Image
                  src={networkLogos[bal.network]}
                  alt={`${bal.network} logo`}
                  width={42}
                  height={42}
                  className={styles.assetLogo}
                  unoptimized
                />
                <div className={styles.assetInfo}>
                  <span className={styles.assetSymbol}>
                    {bal.network.toUpperCase()}
                  </span>
                  <span className={styles.assetName}>
                    {networkNames[bal.network] || bal.network}
                  </span>
                </div>
              </div>

              <div className={styles.assetRight}>
                <span className={styles.assetAmount}>
                  {parseFloat(bal.amount).toFixed(4)}
                </span>
                <span className={styles.assetEur}>
                  € {parseFloat(bal.eur).toFixed(2)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}

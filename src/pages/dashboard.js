"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useMagicLink } from "@/contexts/MagicLinkContext"; // Updated import for MagicLinkContext

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
  const { user, fetchUserWallet } = useMagicLink(); // Updated to use new MagicLinkContext

  const [totalEUR, setTotalEUR] = useState("0.00");
  const [balances, setBalances] = useState([]);
  const [activeNetwork, setActiveNetwork] = useState("bsc");

  useEffect(() => {
    if (user) {
      fetchUserWallet(user.email)
        .then((wallet) => {
          const total = wallet.networks.reduce(
            (acc, net) => acc + parseFloat(net.eur || 0),
            0
          );
          setTotalEUR(total.toFixed(2));
          setBalances(wallet.networks);
        })
        .catch((err) => {
          console.error("Failed to fetch wallet:", err);
          setTotalEUR("0.00");
        });
    } else {
      router.replace("/");
    }
  }, [user, fetchUserWallet, router]);

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

  if (!user) {
    return <div className={styles.loading}>Loading Wallet...</div>;
  }

  return (
    <main className={`${styles.container} ${background.gradient}`}>
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
          {balances && balances.length > 0 ? (
            balances.map((bal) => (
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
            ))
          ) : (
            <p>No balances available.</p>
          )}
        </div>
      </div>
    </main>
  );
}

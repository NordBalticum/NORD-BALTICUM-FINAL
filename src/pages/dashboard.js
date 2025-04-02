"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useMagicLink } from "@/contexts/MagicLinkContext";
import { ethers } from "ethers";
import styles from "@/styles/dashboard.module.css";

const networkConfig = {
  bsc: {
    name: "BNB Smart Chain",
    rpc: "https://bsc-dataseed.binance.org",
    logo: "https://cryptologos.cc/logos/bnb-bnb-logo.png",
  },
  tbnb: {
    name: "BSC Testnet",
    rpc: "https://data-seed-prebsc-1-s1.binance.org:8545",
    logo: "https://cryptologos.cc/logos/binance-coin-bnb-logo.png",
  },
  ethereum: {
    name: "Ethereum",
    rpc: "https://ethereum.publicnode.com", // Greitas ir stabilus viešas RPC
    logo: "https://cryptologos.cc/logos/ethereum-eth-logo.png",
  },
  polygon: {
    name: "Polygon",
    rpc: "https://polygon-rpc.com",
    logo: "https://cryptologos.cc/logos/polygon-matic-logo.png",
  },
  avalanche: {
    name: "Avalanche",
    rpc: "https://api.avax.network/ext/bc/C/rpc",
    logo: "https://cryptologos.cc/logos/avalanche-avax-logo.png",
  },
};

export default function Dashboard() {
  const router = useRouter();
  const { user, wallet } = useMagicLink();

  const [balances, setBalances] = useState([]);
  const [totalEUR, setTotalEUR] = useState("0.00");

  useEffect(() => {
    if (user && wallet) {
      const fetchBalances = async () => {
        const results = await Promise.all(
          Object.entries(networkConfig).map(async ([key, config]) => {
            try {
              const provider = new ethers.providers.JsonRpcProvider(config.rpc);
              const balance = await provider.getBalance(wallet.address);
              const ethValue = parseFloat(ethers.utils.formatEther(balance));
              const eurValue = ethValue * 250; // Naudojam fiksuotą kursą

              return {
                network: key,
                balance: ethValue,
                eur: eurValue,
              };
            } catch (err) {
              console.error(`Error fetching ${key} balance:`, err);
              return {
                network: key,
                balance: 0,
                eur: 0,
              };
            }
          })
        );

        setBalances(results);
        const total = results.reduce((sum, b) => sum + b.eur, 0);
        setTotalEUR(total.toFixed(2));
      };

      fetchBalances();
    } else {
      router.replace("/");
    }
  }, [user, wallet]);

  const handleCardClick = (symbol) => {
    router.push(`/${symbol}`);
  };

  return (
    <main className={styles.container}>
      <div className={styles.avatarCenter}>
        <img src="/icons/avatar-default.svg" alt="Avatar" />
      </div>

      <div className={styles.dashboardWrapper}>
        <div className={styles.totalValueContainer}>
          <p className={styles.totalLabel}>Total Value</p>
          <h2 className={styles.totalValue}>€ {totalEUR}</h2>
        </div>

        <div className={styles.assetList}>
          {balances.length > 0 ? (
            balances.map((bal) => (
              <div
                key={bal.network}
                className={styles.assetItem}
                onClick={() => handleCardClick(bal.network)}
              >
                <div className={styles.assetLeft}>
                  <img
                    src={networkConfig[bal.network].logo}
                    alt={`${bal.network} logo`}
                    className={styles.assetLogo}
                  />
                  <div className={styles.assetInfo}>
                    <span className={styles.assetSymbol}>
                      {bal.network.toUpperCase()}
                    </span>
                    <span className={styles.assetName}>
                      {networkConfig[bal.network].name}
                    </span>
                  </div>
                </div>

                <div className={styles.assetRight}>
                  <span className={styles.assetAmount}>
                    {bal.balance.toFixed(5)}
                  </span>
                  <span className={styles.assetEur}>
                    € {bal.eur.toFixed(2)}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <p>Loading balances...</p>
          )}
        </div>
      </div>
    </main>
  );
}

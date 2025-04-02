"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useMagicLink } from "@/contexts/MagicLinkContext";
import { ethers } from "ethers";
import Image from "next/image";
import styles from "@/styles/dashboard.module.css";

const networkConfig = {
  bsc: {
    name: "BNB Smart Chain",
    rpc: "https://bsc-dataseed.binance.org",
    logo: "https://cryptologos.cc/logos/bnb-bnb-logo.png",
    coingeckoId: "binancecoin",
  },
  tbnb: {
    name: "BSC Testnet",
    rpc: "https://data-seed-prebsc-1-s1.binance.org:8545",
    logo: "https://cryptologos.cc/logos/binance-coin-bnb-logo.png",
    coingeckoId: "binancecoin",
  },
  ethereum: {
    name: "Ethereum",
    rpc: "https://ethereum.publicnode.com",
    logo: "https://cryptologos.cc/logos/ethereum-eth-logo.png",
    coingeckoId: "ethereum",
  },
  polygon: {
    name: "Polygon",
    rpc: "https://polygon-rpc.com",
    logo: "https://cryptologos.cc/logos/polygon-matic-logo.png",
    coingeckoId: "polygon",
  },
  avalanche: {
    name: "Avalanche",
    rpc: "https://api.avax.network/ext/bc/C/rpc",
    logo: "https://cryptologos.cc/logos/avalanche-avax-logo.png",
    coingeckoId: "avalanche-2",
  },
};

export default function Dashboard() {
  const router = useRouter();
  const { user, wallet } = useMagicLink();

  const [balances, setBalances] = useState([]);
  const [totalEUR, setTotalEUR] = useState("0.00");

  useEffect(() => {
    let interval;

    const fetchPrices = async () => {
      try {
        const ids = [...new Set(Object.values(networkConfig).map((n) => n.coingeckoId))].join(",");
        const res = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=eur`);
        const data = await res.json();
        return data;
      } catch (err) {
        console.error("CoinGecko error:", err);
        return {};
      }
    };

    const fetchBalances = async () => {
      if (!wallet) return;
      const prices = await fetchPrices();

      const results = await Promise.all(
        Object.entries(networkConfig).map(async ([key, config]) => {
          try {
            const provider = new ethers.providers.JsonRpcProvider(config.rpc);
            const balance = await provider.getBalance(wallet.address);
            const ethValue = parseFloat(ethers.utils.formatEther(balance));
            const price = prices[config.coingeckoId]?.eur || 0;
            const eurValue = ethValue * price;

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

    if (user && wallet) {
      fetchBalances();
      interval = setInterval(fetchBalances, 30000); // Refresh kas 30s
    } else {
      router.replace("/");
    }

    return () => clearInterval(interval);
  }, [user, wallet]);

  const handleCardClick = (symbol) => {
    router.push(`/${symbol}`);
  };

  return (
    <main className={styles.container}>
      <div className={styles.dashboardWrapper} style={{ paddingTop: "116px" }}>
        <div className={styles.totalValueContainer} style={{ marginBottom: "32px", animation: "fadeInDown 0.5s ease-out" }}>
          <Image
            src="/icons/logo.svg"
            alt="NordBalticum"
            width={340}
            height={122}
            priority
            className={styles.logo}
          />
          <div style={{ marginTop: "14px" }}>
            <p className={styles.totalLabel}>Total Value</p>
            <h2 className={styles.totalValue}>€ {totalEUR}</h2>
          </div>
        </div>

        <div className={styles.assetList} style={{ animation: "fadeInUp 0.8s ease-out" }}>
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
            <p style={{ textAlign: "center", marginTop: "64px", opacity: 0.8 }}>Loading balances...</p>
          )}
        </div>
      </div>
    </main>
  );
}

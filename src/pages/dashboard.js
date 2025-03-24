"use client";
import React, { useEffect, useState } from "react";
import styles from "./dashboard.module.css";
import { useMagic } from "/@loginsystem/MagicLinkContext";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { fetchBalancesForAllChains } from "/@utils/fetchBalancesForAllChains";

const networks = [
  {
    name: "BNB Smart Chain",
    symbol: "BNB",
    logo: "https://cryptologos.cc/logos/bnb-bnb-logo.png",
  },
  {
    name: "BSC Testnet",
    symbol: "TBNB",
    logo: "https://cryptologos.cc/logos/binance-coin-bnb-logo.png",
  },
  {
    name: "Ethereum",
    symbol: "ETH",
    logo: "https://cryptologos.cc/logos/ethereum-eth-logo.png",
  },
  {
    name: "Polygon",
    symbol: "POL",
    logo: "https://cryptologos.cc/logos/polygon-matic-logo.png",
  },
  {
    name: "Avalanche",
    symbol: "AVAX",
    logo: "https://cryptologos.cc/logos/avalanche-avax-logo.png",
  },
];

export default function Dashboard() {
  const router = useRouter();
  const { user, publicAddress } = useMagic();
  const [balances, setBalances] = useState({});

  const loadBalances = async () => {
    if (publicAddress) {
      const data = await fetchBalancesForAllChains(publicAddress);
      setBalances(data);
    }
  };

  useEffect(() => {
    if (!user) {
      router.push("/");
    } else {
      loadBalances();
      const interval = setInterval(loadBalances, 10000);
      return () => clearInterval(interval);
    }
  }, [user, publicAddress]);

  if (!user) return null;

  return (
    <div className={styles.container}>
      <div className={styles.headerBox}>
        <div className={styles.walletLabel}>WALLET</div>
        <div className={styles.walletAddress}>
          {publicAddress?.slice(0, 6)}...{publicAddress?.slice(-4)}
        </div>
      </div>

      <div className={styles.assetList}>
        {networks.map((net) => {
          const bal = balances[net.symbol] || { amount: "0.0000", eur: "0.00" };
          return (
            <div key={net.symbol} className={styles.assetItem}>
              <div className={styles.assetLeft}>
                <Image
                  src={net.logo}
                  alt={net.symbol}
                  width={36}
                  height={36}
                  className={styles.assetLogo}
                />
                <div className={styles.assetText}>
                  <div className={styles.assetSymbol}>{net.symbol}</div>
                  <div className={styles.assetName}>{net.name}</div>
                </div>
              </div>
              <div className={styles.assetBalance}>
                {bal.amount} {net.symbol}
                <div style={{ fontSize: "14px", opacity: 0.6 }}>€ {bal.eur}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

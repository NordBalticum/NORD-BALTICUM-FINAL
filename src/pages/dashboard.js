"use client";
import React from "react";
import styles from "@/styles/dashboard.module.css";
import { useRouter } from "next/navigation";
import { useMagic } from "@/contexts/MagicLinkContext";
import { useBalance } from "@/contexts/BalanceContext";
import Image from "next/image";

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
  const { balances, loading } = useBalance();

  if (!user) {
    router.push("/");
    return null;
  }

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
                {loading ? "..." : `${bal.amount} ${net.symbol}`}
                <div className={styles.assetEur}>€ {bal.eur}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

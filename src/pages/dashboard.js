"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { motion } from "framer-motion";

import { useMagicLink } from "@/contexts/MagicLinkContext";
import { useWallet } from "@/contexts/WalletContext";
import { useBalance } from "@/hooks/useBalance";

import StarsBackground from "@/components/StarsBackground";
import background from "@/styles/background.module.css";
import styles from "@/styles/dashboard.module.css";

const networks = [
  {
    key: "tbnb",
    name: "BNB Testnet",
    logo: "https://cryptologos.cc/logos/binance-coin-bnb-logo.png",
    route: "/tbnb",
  },
  {
    key: "bnb",
    name: "BNB Chain",
    logo: "https://cryptologos.cc/logos/binance-coin-bnb-logo.png",
    route: "/bnb",
  },
  {
    key: "eth",
    name: "Ethereum",
    logo: "https://cryptologos.cc/logos/ethereum-eth-logo.png",
    route: "/eth",
  },
  {
    key: "matic",
    name: "Polygon",
    logo: "https://cryptologos.cc/logos/polygon-matic-logo.png",
    route: "/matic",
  },
  {
    key: "avax",
    name: "Avalanche",
    logo: "https://cryptologos.cc/logos/avalanche-avax-logo.png",
    route: "/avax",
  },
];

export default function Dashboard() {
  const router = useRouter();
  const { user } = useMagicLink();
  const { publicKey } = useWallet();
  const { balances, isLoading, refresh } = useBalance();

  useEffect(() => {
    if (!user || !publicKey) {
      router.push("/");
    }
  }, [user, publicKey, router]);

  return (
    <main className={`${styles.container} ${background.gradient}`}>
      <StarsBackground />

      <div className={styles.wrapper}>
        <h1 className={styles.title}>Your Wallet Dashboard</h1>
        <p className={styles.subtext}>Multi-Chain Wallet Overview</p>

        <div className={styles.networkGrid}>
          {networks.map((net, index) => {
            const data = balances[net.key] || {};
            return (
              <motion.div
                key={net.key}
                className={styles.networkCard}
                onClick={() => router.push(net.route)}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.08, duration: 0.4 }}
              >
                <div className={styles.networkHeader}>
                  <Image
                    src={net.logo}
                    alt={`${net.name} logo`}
                    width={42}
                    height={42}
                    className={styles.networkLogo}
                    unoptimized
                  />
                  <div>
                    <p className={styles.networkName}>{net.name}</p>
                    <p className={styles.networkKey}>{net.key.toUpperCase()}</p>
                  </div>
                </div>

                <div className={styles.balanceInfo}>
                  <p className={styles.amount}>
                    {data.amount || "0.00000"} {net.key.toUpperCase()}
                  </p>
                  <p className={styles.eur}>~€ {data.eur || "0.00"}</p>
                </div>
              </motion.div>
            );
          })}
        </div>

        <div className={styles.totalBalanceBox}>
          <h3>Total Wallet Value:</h3>
          <p className={styles.totalAmount}>
            {isLoading ? "Loading..." : `~€ ${balances.totalEUR || "0.00"}`}
          </p>
        </div>
      </div>
    </main>
  );
}

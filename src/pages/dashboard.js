// src/pages/dashboard.js
"use client";

import { useEffect } from "react";
import { useRouter } from "next/router";
import { useMagicLink } from "@/contexts/MagicLinkContext";
import { useBalance } from "@/contexts/BalanceProviderEthers";
import styles from "@/styles/dashboard.module.css";
import Image from "next/image";

export default function Dashboard() {
  const router = useRouter();
  const { user, wallet } = useMagicLink();
  const { balance, selectedNetwork, setSelectedNetwork } = useBalance();

  useEffect(() => {
    if (!user || !wallet) {
      const timeout = setTimeout(() => router.push("/"), 800);
      return () => clearTimeout(timeout);
    }
  }, [user, wallet, router]);

  if (!user || !wallet) {
    return <div className={styles.loading}>Loading Wallet...</div>;
  }

  const displayAddress = `${wallet.address.slice(0, 6)}...${wallet.address.slice(-4)}`;

  const networks = [
    {
      name: "BNB Smart Chain",
      short: "BNB",
      id: "bsc",
      logo: "https://cryptologos.cc/logos/bnb-bnb-logo.png",
    },
    {
      name: "BSC Testnet",
      short: "TBNB",
      id: "bscTestnet",
      logo: "https://cryptologos.cc/logos/binance-coin-bnb-logo.png",
    },
  ];

  return (
    <div className={styles.dashboardContainer}>
      <div className={styles.header}>
        <div className={styles.walletInfo}>
          <p className={styles.label}>Wallet</p>
          <h2 className={styles.address}>{displayAddress}</h2>
        </div>
        <div className={styles.networkSelector}>
          <select
            className={styles.select}
            value={selectedNetwork}
            onChange={(e) => setSelectedNetwork(e.target.value)}
          >
            {networks.map((net) => (
              <option key={net.id} value={net.id}>
                {net.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className={styles.tokenTable}>
        {networks.map((net) => (
          <div key={net.id} className={styles.tokenRow}>
            <div className={styles.tokenInfo}>
              <Image
                src={net.logo}
                alt={net.name}
                width={32}
                height={32}
                className={styles.tokenLogo}
              />
              <div>
                <p className={styles.tokenSymbol}>{net.short}</p>
                <p className={styles.tokenName}>{net.name}</p>
              </div>
            </div>
            <div className={styles.tokenBalance}>
              {selectedNetwork === net.id ? balance : "—"} {net.short}
            </div>
          </div>
        ))}
      </div>

      <p className={styles.note}>
        Staking & transactions history will be shown here soon.
      </p>
    </div>
  );
}

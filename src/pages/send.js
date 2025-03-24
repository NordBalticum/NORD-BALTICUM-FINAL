"use client";

import { useRouter } from "next/router";
import { useMagicLink } from "@/contexts/MagicLinkContext";
import styles from "@/styles/send.module.css";
import BottomNavigation from "@/components/BottomNavigation";

export default function Send() {
  const { user, wallet } = useMagicLink();
  const router = useRouter();

  const networks = [
    {
      name: "BNB Smart Chain",
      symbol: "BNB",
      balance: "0.0000",
      route: "/bnb",
      icon: "https://cryptologos.cc/logos/bnb-bnb-logo.png",
    },
    {
      name: "BSC Testnet",
      symbol: "TBNB",
      balance: "0.0000",
      route: "/tbnb",
      icon: "https://cryptologos.cc/logos/bnb-bnb-logo.png",
    },
    {
      name: "Ethereum",
      symbol: "ETH",
      balance: "0.0000",
      route: "/eth",
      icon: "https://cryptologos.cc/logos/ethereum-eth-logo.png",
    },
    {
      name: "Polygon",
      symbol: "POL",
      balance: "0.0000",
      route: "/pol",
      icon: "https://cryptologos.cc/logos/polygon-matic-logo.png",
    },
    {
      name: "Avalanche",
      symbol: "AVAX",
      balance: "0.0000",
      route: "/avax",
      icon: "https://cryptologos.cc/logos/avalanche-avax-logo.png",
    },
  ];

  if (!user || !wallet) return <div className={styles.loading}>Loading Wallet...</div>;

  return (
    <div className="globalContainer">
      <div className={styles.wrapper}>
        <h1 className={styles.title}>SEND CRYPTO</h1>
        <p className={styles.subtext}>Choose Network:</p>

        <div className={styles.networkGrid}>
          {networks.map((net) => (
            <div
              key={net.symbol}
              className={styles.networkBox}
              onClick={() => router.push(net.route)}
            >
              <img src={net.icon} alt={net.symbol} className={styles.networkIcon} />
              <div className={styles.networkInfo}>
                <span className={styles.networkLabel}>{net.name}</span>
                <span className={styles.networkBalance}>
                  {net.balance} {net.symbol}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <BottomNavigation />
    </div>
  );
}

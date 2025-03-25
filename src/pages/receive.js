"use client";

import { useRouter } from "next/router";
import { useMagicLink } from "@/contexts/MagicLinkContext";
import styles from "@/styles/receive.module.css";
import BottomNavigation from "@/components/BottomNavigation";

const networkOptions = [
  {
    value: "bsc",
    label: "BNB Smart Chain",
    symbol: "BNB",
    balance: "0.0000 BNB",
    icon: "https://cryptologos.cc/logos/bnb-bnb-logo.png",
    route: "/receive/bnb"
  },
  {
    value: "bsctest",
    label: "BSC Testnet",
    symbol: "TBNB",
    balance: "0.0000 TBNB",
    icon: "https://cryptologos.cc/logos/bnb-bnb-logo.png",
    route: "/receive/tbnb"
  },
  {
    value: "eth",
    label: "Ethereum",
    symbol: "ETH",
    balance: "0.0000 ETH",
    icon: "https://cryptologos.cc/logos/ethereum-eth-logo.png",
    route: "/receive/eth"
  },
  {
    value: "polygon",
    label: "Polygon",
    symbol: "POL",
    balance: "0.0000 POL",
    icon: "https://cryptologos.cc/logos/polygon-matic-logo.png",
    route: "/receive/pol"
  },
  {
    value: "avax",
    label: "Avalanche",
    symbol: "AVAX",
    balance: "0.0000 AVAX",
    icon: "https://cryptologos.cc/logos/avalanche-avax-logo.png",
    route: "/receive/avax"
  }
];

export default function Receive() {
  const router = useRouter();
  const { user } = useMagicLink();

  if (!user) {
    return <div className={styles.loading}>Loading Wallet...</div>;
  }

  return (
    <div className="globalContainer">
      <div className={styles.wrapper}>
        <h1 className={styles.title}>RECEIVE CRYPTO</h1>
        <p className={styles.subtext}>Choose Network:</p>

        <div className={styles.networkGrid}>
          {networkOptions.map((network) => (
            <div
              key={network.value}
              className={styles.networkBox}
              onClick={() => router.push(network.route)}
            >
              <img
                src={network.icon}
                alt={network.label}
                className={styles.networkIcon}
              />
              <div className={styles.networkInfo}>
                <span className={styles.networkLabel}>{network.label}</span>
                <span className={styles.networkBalance}>{network.balance}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <BottomNavigation />
    </div>
  );
}

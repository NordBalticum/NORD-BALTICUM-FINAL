"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

import { useMagicLink } from "@/contexts/MagicLinkContext";
import { useWallet } from "@/contexts/WalletContext";

import BottomNavigation from "@/components/BottomNavigation";
import styles from "@/styles/swipe.module.css";

const networks = [
  {
    name: "BNB Smart Chain",
    symbol: "BNB",
    route: "/receive/bnb",
    icon: "https://cryptologos.cc/logos/bnb-bnb-logo.png",
  },
  {
    name: "BSC Testnet",
    symbol: "TBNB",
    route: "/receive/tbnb",
    icon: "https://cryptologos.cc/logos/bnb-bnb-logo.png",
  },
  {
    name: "Ethereum",
    symbol: "ETH",
    route: "/receive/eth",
    icon: "https://cryptologos.cc/logos/ethereum-eth-logo.png",
  },
  {
    name: "Polygon",
    symbol: "POL",
    route: "/receive/pol",
    icon: "https://cryptologos.cc/logos/polygon-matic-logo.png",
  },
  {
    name: "Avalanche",
    symbol: "AVAX",
    route: "/receive/avax",
    icon: "https://cryptologos.cc/logos/avalanche-avax-logo.png",
  },
];

export default function Receive() {
  const router = useRouter();
  const { user } = useMagicLink();
  const { wallet } = useWallet();

  const [selected, setSelected] = useState(0);

  useEffect(() => {
    if (!user || !wallet?.address) router.push("/");
  }, [user, wallet]);

  if (!user || !wallet?.address) return <div className={styles.loading}>Loading Wallet...</div>;

  return (
    <div className="globalContainer">
      <div className={styles.wrapper}>
        <h1 className={styles.title}>RECEIVE CRYPTO</h1>
        <p className={styles.subtext}>Choose your network to receive</p>

        <div className={styles.swipeWrapper}>
          {networks.map((net, index) => (
            <div
              key={net.symbol}
              className={`${styles.walletCard} ${selected === index ? styles.selected : ""}`}
              onClick={() => {
                setSelected(index);
                router.push(net.route);
              }}
            >
              <div className={styles.walletHeader}>
                <span className={styles.walletName}>{net.name}</span>
                <span className={styles.walletBalance}>0.0000 {net.symbol}</span>
              </div>
              <Image
                src={net.icon}
                alt={net.symbol}
                width={48}
                height={48}
                className={styles.icon}
                unoptimized
              />
            </div>
          ))}
        </div>
      </div>

      <BottomNavigation />
    </div>
  );
}

"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useMagicLink } from "@/contexts/MagicLinkContext";
import { supabase } from "@/lib/supabaseClient";
import styles from "@/styles/swipe.module.css";
import BottomNavigation from "@/components/BottomNavigation";

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
  {
    name: "Solana",
    symbol: "SOL",
    route: "/receive/sol",
    icon: "https://cryptologos.cc/logos/solana-sol-logo.png",
  },
];

export default function Receive() {
  const { user } = useMagicLink();
  const router = useRouter();
  const [selected, setSelected] = useState(0);

  if (!user) return <div className={styles.loading}>Loading Wallet...</div>;

  return (
    <div className="globalContainer">
      <div className={styles.swipeWrapper}>
        <h1 className={styles.title}>RECEIVE CRYPTO</h1>
        <p className={styles.subtitle}>Swipe to choose the network</p>
        <div className={styles.swipeWrapper}>
          {networks.map((net, index) => (
            <div
              key={net.symbol}
              className={styles.walletCard}
              onClick={() => {
                setSelected(index);
                router.push(net.route);
              }}
            >
              <div className={styles.walletHeader}>
                <span className={styles.walletName}>{net.name}</span>
                <span className={styles.walletBalance}>0.0000 {net.symbol}</span>
              </div>
              <img src={net.icon} alt={net.symbol} className={styles.icon} />
            </div>
          ))}
        </div>
      </div>
      <BottomNavigation />
    </div>
  );
}

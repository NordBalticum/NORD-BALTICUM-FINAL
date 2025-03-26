
"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useMagicLink } from "@/contexts/MagicLinkContext";
import { ethers } from "ethers";
import BottomNavigation from "@/components/BottomNavigation";
import styles from "@/styles/swipe.module.css";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const networks = [
  {
    name: "BNB Smart Chain",
    symbol: "BNB",
    route: "/bnb",
    icon: "https://cryptologos.cc/logos/bnb-bnb-logo.png",
  },
  {
    name: "BSC Testnet",
    symbol: "TBNB",
    route: "/tbnb",
    icon: "https://cryptologos.cc/logos/bnb-bnb-logo.png",
  },
  {
    name: "Ethereum",
    symbol: "ETH",
    route: "/eth",
    icon: "https://cryptologos.cc/logos/ethereum-eth-logo.png",
  },
  {
    name: "Polygon",
    symbol: "POL",
    route: "/pol",
    icon: "https://cryptologos.cc/logos/polygon-matic-logo.png",
  },
  {
    name: "Avalanche",
    symbol: "AVAX",
    route: "/avax",
    icon: "https://cryptologos.cc/logos/avalanche-avax-logo.png",
  },
  {
    name: "Solana",
    symbol: "SOL",
    route: "/sol",
    icon: "https://cryptologos.cc/logos/solana-sol-logo.png",
  },
];

export default function Send() {
  const { user } = useMagicLink();
  const router = useRouter();
  const [selected, setSelected] = useState(0);

  const handleRoute = () => {
    router.push(networks[selected].route);
  };

  if (!user) return <div className={styles.loading}>Loading Wallet...</div>;

  return (
    <div className="globalContainer">
      <div className={styles.swipeWrapper}>
        <h1 className={styles.title}>SEND CRYPTO</h1>
        <div className={styles.carousel}>
          {networks.map((net, index) => (
            <div
              key={net.symbol}
              className={`${styles.card} ${index === selected ? styles.active : ""}`}
              onClick={() => setSelected(index)}
            >
              <img src={net.icon} alt={net.symbol} className={styles.icon} />
              <h2>{net.symbol}</h2>
              <p>{net.name}</p>
            </div>
          ))}
        </div>

        <div className={styles.infoBox}>
          <p>Receiver Address</p>
          <input type="text" placeholder="0x..." className={styles.input} />
          <p>Amount</p>
          <input type="number" placeholder="0.00" className={styles.input} />
          <p>Estimated Fee: 0.003 {networks[selected].symbol}</p>
          <button onClick={handleRoute} className={styles.sendBtn}>
            SEND
          </button>
        </div>
      </div>
      <BottomNavigation />
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { useMagicLink } from "@/contexts/MagicLinkContext";
import { supabase } from "@/lib/supabaseClient";
import { ethers } from "ethers";
import styles from "@/styles/swipe.module.css";
import BottomNavigation from "@/components/BottomNavigation";
import Image from "next/image";

const networks = [
  {
    name: "BNB Smart Chain",
    symbol: "BNB",
    balance: "0.0000",
    icon: "https://cryptologos.cc/logos/bnb-bnb-logo.png",
    route: "/receive/bnb"
  },
  {
    name: "BSC Testnet",
    symbol: "TBNB",
    balance: "0.0000",
    icon: "https://cryptologos.cc/logos/bnb-bnb-logo.png",
    route: "/receive/tbnb"
  },
  {
    name: "Ethereum",
    symbol: "ETH",
    balance: "0.0000",
    icon: "https://cryptologos.cc/logos/ethereum-eth-logo.png",
    route: "/receive/eth"
  },
  {
    name: "Polygon",
    symbol: "POL",
    balance: "0.0000",
    icon: "https://cryptologos.cc/logos/polygon-matic-logo.png",
    route: "/receive/pol"
  },
  {
    name: "Avalanche",
    symbol: "AVAX",
    balance: "0.0000",
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
    <div className={styles.container}>
      <h1 className={styles.pageTitle}>RECEIVE CRYPTO</h1>
      <p className={styles.subtext}>Swipe to choose the network</p>

      <div className={styles.swiper}>
        {networks.map((network, index) => (
          <div
            key={network.symbol}
            className={styles.card}
            onClick={() => router.push(network.route)}
          >
            <Image
              src={network.icon}
              width={52}
              height={52}
              alt={network.symbol}
              className={styles.icon}
            />
            <h2 className={styles.cardTitle}>{network.name}</h2>
            <p className={styles.cardBalance}>{network.balance} {network.symbol}</p>
          </div>
        ))}
      </div>

      <BottomNavigation />
    </div>
  );
}

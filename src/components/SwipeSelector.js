"use client";

import React, { useEffect, useRef } from "react";
import Image from "next/image";
import { motion } from "framer-motion";

import { supportedNetworks } from "@/utils/networks";
import styles from "@/styles/swipeselector.module.css";

const logoUrls = {
  bnb: "https://cryptologos.cc/logos/bnb-bnb-logo.png",
  eth: "https://cryptologos.cc/logos/ethereum-eth-logo.png",
  matic: "https://cryptologos.cc/logos/polygon-matic-logo.png",
  avax: "https://cryptologos.cc/logos/avalanche-avax-logo.png",
  arb: "https://cryptologos.cc/logos/arbitrum-arb-logo.png",
};

export default function SwipeSelector({ mode = "send", onSelect }) {
  const containerRef = useRef(null);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTo({ left: 0, behavior: "smooth" });
    }
  }, []);

  const handleSelect = (symbol) => {
    if (typeof onSelect === "function") {
      onSelect(symbol);
    }
  };

  return (
    <div className={styles.swipeWrapper} ref={containerRef}>
      {supportedNetworks.map((net) => {
        const symbol = net.symbol.toLowerCase();
        const iconUrl = logoUrls[symbol] || `https://cryptologos.cc/logos/${symbol}-${symbol}-logo.png`;

        return (
          <motion.div
            key={net.symbol}
            className={styles.card}
            whileTap={{ scale: 0.95 }}
            whileHover={{ scale: 1.06 }}
            onClick={() => handleSelect(net.symbol)}
          >
            <Image
              src={iconUrl}
              alt={`${net.symbol} logo`}
              width={64}
              height={64}
              className={styles.logo}
              unoptimized
            />
            <div className={styles.name}>{net.name}</div>
          </motion.div>
        );
      })}
    </div>
  );
}

"use client";

import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import styles from "@/components/swipeselector.module.css";

// Hardcoded logotipų nuorodos (stabilios)
const supportedNetworks = [
  {
    name: "BNB Testnet",
    symbol: "tbnb",
    logo: "https://cryptologos.cc/logos/binance-coin-bnb-logo.png",
  },
  {
    name: "BNB Chain",
    symbol: "bnb",
    logo: "https://cryptologos.cc/logos/binance-coin-bnb-logo.png",
  },
  {
    name: "Ethereum",
    symbol: "eth",
    logo: "https://cryptologos.cc/logos/ethereum-eth-logo.png",
  },
  {
    name: "Polygon",
    symbol: "pol",
    logo: "https://cryptologos.cc/logos/polygon-matic-logo.png",
  },
  {
    name: "Avalanche",
    symbol: "avax",
    logo: "https://cryptologos.cc/logos/avalanche-avax-logo.png",
  },
];

export default function SwipeSelector({ mode = "send", onSelect }) {
  const containerRef = useRef(null);
  const [selectedSymbol, setSelectedSymbol] = useState(supportedNetworks[0].symbol);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTo({ left: 0, behavior: "smooth" });
    }
  }, []);

  const handleSelect = (symbol, index) => {
    setSelectedSymbol(symbol);
    if (typeof onSelect === "function") onSelect(symbol);

    const cards = containerRef.current?.children;
    const selectedCard = cards?.[index];
    if (selectedCard && containerRef.current) {
      const offset = selectedCard.offsetLeft - containerRef.current.offsetWidth / 2 + selectedCard.offsetWidth / 2;
      containerRef.current.scrollTo({ left: offset, behavior: "smooth" });
    }
  };

  return (
    <div className={styles.selectorContainer}>
      <div className={styles.swipeWrapper} ref={containerRef}>
        {supportedNetworks.map((net, index) => (
          <motion.div
            key={net.symbol}
            className={`${styles.card} ${selectedSymbol === net.symbol ? styles.selected : ""}`}
            whileTap={{ scale: 0.95 }}
            whileHover={{ scale: 1.06 }}
            onClick={() => handleSelect(net.symbol, index)}
            role="button"
            tabIndex={0}
          >
            <Image
              src={net.logo}
              alt={`${net.name} logo`}
              width={64}
              height={64}
              className={styles.logo}
              unoptimized
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = "/default-logo.png";
              }}
            />
            <div className={styles.name}>{net.name}</div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

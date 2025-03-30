// /components/SwipeSelector.js
"use client";

import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import styles from "@/components/swipeselector.module.css";

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
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const updateSize = () => setIsMobile(window.innerWidth <= 1024);
    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  const handleScroll = (direction) => {
    if (!containerRef.current) return;
    const scrollAmount = 180;
    const current = containerRef.current.scrollLeft;
    containerRef.current.scrollTo({
      left: direction === "left" ? current - scrollAmount : current + scrollAmount,
      behavior: "smooth",
    });
  };

  const handleSelect = (symbol, index) => {
    setSelectedSymbol(symbol);
    if (typeof onSelect === "function") onSelect(symbol);

    if (isMobile && containerRef.current?.children?.[index]) {
      const card = containerRef.current.children[index];
      const offset =
        card.offsetLeft -
        containerRef.current.offsetWidth / 2 +
        card.offsetWidth / 2;

      containerRef.current.scrollTo({ left: offset, behavior: "smooth" });
    }
  };

  return (
    <div className={styles.selectorContainer}>
      {isMobile && (
        <div className={styles.arrows}>
          <button onClick={() => handleScroll("left")} className={styles.arrowBtn}>←</button>
          <button onClick={() => handleScroll("right")} className={styles.arrowBtn}>→</button>
        </div>
      )}
      <div
        className={isMobile ? styles.scrollableWrapper : styles.staticWrapper}
        ref={containerRef}
        style={isMobile ? { touchAction: "pan-x", overflowX: "auto" } : {}}
      >
        {supportedNetworks.map((net, index) => (
          <motion.div
            key={net.symbol}
            className={`${styles.card} ${selectedSymbol === net.symbol ? styles.selected : ""}`}
            whileTap={{ scale: 0.96 }}
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

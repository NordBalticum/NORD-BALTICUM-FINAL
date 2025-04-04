"use client";

import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import styles from "@/components/swipeselector.module.css";

const supportedNetworks = [
  { name: "BNB Testnet", symbol: "tbnb", logo: "https://cryptologos.cc/logos/binance-coin-bnb-logo.png" },
  { name: "BNB Chain", symbol: "bnb", logo: "https://cryptologos.cc/logos/binance-coin-bnb-logo.png" },
  { name: "Ethereum", symbol: "eth", logo: "https://cryptologos.cc/logos/ethereum-eth-logo.png" },
  { name: "Polygon", symbol: "pol", logo: "https://cryptologos.cc/logos/polygon-matic-logo.png" },
  { name: "Avalanche", symbol: "avax", logo: "https://cryptologos.cc/logos/avalanche-avax-logo.png" },
];

export default function SwipeSelector({ mode = "send", onSelect }) {
  const containerRef = useRef(null);
  const [selectedIndex, setSelectedIndex] = useState(2); // Default Ethereum
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const updateSize = () => setIsMobile(window.innerWidth <= 1024);
    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  useEffect(() => {
    if (supportedNetworks[selectedIndex]) {
      onSelect?.(supportedNetworks[selectedIndex].symbol); // <-- SIUNČIA SYMBOL!
    }
    if (isMobile) scrollToCenter(selectedIndex);
  }, [selectedIndex, isMobile, onSelect]);

  const scrollToCenter = (index) => {
    const container = containerRef.current;
    const card = container?.children?.[index];
    if (card && container) {
      const offset = card.offsetLeft - container.offsetWidth / 2 + card.offsetWidth / 2;
      container.scrollTo({ left: offset, behavior: "smooth" });
    }
  };

  const handleSelect = (index) => {
    setSelectedIndex(index);
    if (supportedNetworks[index]) {
      onSelect?.(supportedNetworks[index].symbol); // <-- SIUNČIA SYMBOL!
    }
    if (isMobile) scrollToCenter(index);
  };

  const goLeft = () => {
    if (selectedIndex > 0) {
      handleSelect(selectedIndex - 1);
    }
  };

  const goRight = () => {
    if (selectedIndex < supportedNetworks.length - 1) {
      handleSelect(selectedIndex + 1);
    }
  };

  return (
    <div className={styles.selectorContainer}>
      {/* Arrows for Mobile */}
      <div className={styles.arrows}>
        <button className={styles.arrowBtn} onClick={goLeft}>&#x2190;</button>
        <button className={styles.arrowBtn} onClick={goRight}>&#x2192;</button>
      </div>

      <div
        className={isMobile ? styles.scrollableWrapper : styles.staticWrapper}
        ref={containerRef}
        style={isMobile ? { touchAction: "pan-x", overflowX: "auto", scrollBehavior: "smooth" } : {}}
      >
        {supportedNetworks.map((net, index) => (
          <motion.div
            key={net.symbol}
            className={`${styles.card} ${selectedIndex === index ? styles.selected : ""}`}
            whileTap={{ scale: 0.96 }}
            onClick={() => handleSelect(index)}
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
            />
            <div className={styles.name}>{net.name}</div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

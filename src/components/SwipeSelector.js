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
  const [selectedIndex, setSelectedIndex] = useState(2); // Default to Ethereum
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const updateSize = () => setIsMobile(window.innerWidth <= 1024);
    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  useEffect(() => {
    onSelect?.(supportedNetworks[selectedIndex].symbol);
    if (isMobile && containerRef.current) {
      const card = containerRef.current.children[selectedIndex];
      if (card) {
        const offset =
          card.offsetLeft - containerRef.current.offsetWidth / 2 + card.offsetWidth / 2;
        containerRef.current.scrollTo({ left: offset, behavior: "smooth" });
      }
    }
  }, [selectedIndex, isMobile]);

  const handleSelect = (index) => setSelectedIndex(index);
  const goLeft = () => selectedIndex > 0 && setSelectedIndex((prev) => prev - 1);
  const goRight = () => selectedIndex < supportedNetworks.length - 1 && setSelectedIndex((prev) => prev + 1);

  return (
    <div className={styles.selectorContainer}>
      {/* Mobile Arrows */}
      <div className={styles.arrows}>
        <button className={styles.arrowBtn} onClick={goLeft}>←</button>
        <button className={styles.arrowBtn} onClick={goRight}>→</button>
      </div>

      <div
        className={isMobile ? styles.scrollableWrapper : styles.staticWrapper}
        ref={containerRef}
        style={isMobile ? { touchAction: "pan-x", overflowX: "auto" } : {}}
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

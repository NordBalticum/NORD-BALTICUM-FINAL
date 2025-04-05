"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { useAuth } from "@/contexts/AuthContext";
import { usePageReady } from "@/hooks/usePageReady";
import styles from "@/components/swipeselector.module.css";

const supportedNetworks = [
  { name: "BNB Testnet", symbol: "tbnb", logo: "https://cryptologos.cc/logos/binance-coin-bnb-logo.png" },
  { name: "BNB Chain", symbol: "bnb", logo: "https://cryptologos.cc/logos/binance-coin-bnb-logo.png" },
  { name: "Ethereum", symbol: "eth", logo: "https://cryptologos.cc/logos/ethereum-eth-logo.png" },
  { name: "Polygon", symbol: "matic", logo: "https://cryptologos.cc/logos/polygon-matic-logo.png" },
  { name: "Avalanche", symbol: "avax", logo: "https://cryptologos.cc/logos/avalanche-avax-logo.png" },
];

export default function SwipeSelector({ onSelect }) {
  const { activeNetwork, setActiveNetwork } = useAuth();
  const containerRef = useRef(null);
  const [selectedIndex, setSelectedIndex] = useState(2);
  const [isMobile, setIsMobile] = useState(false);
  const isReady = usePageReady();

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 1024);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (!isReady) return;
    if (supportedNetworks[selectedIndex]) {
      const selectedSymbol = supportedNetworks[selectedIndex].symbol;
      setActiveNetwork(selectedSymbol);
      onSelect?.(selectedSymbol);
    }
    if (isMobile) scrollToCenter(selectedIndex);
  }, [selectedIndex, isMobile, setActiveNetwork, onSelect, isReady]);

  useEffect(() => {
    if (!isReady) return;
    const idx = supportedNetworks.findIndex((net) => net.symbol === activeNetwork);
    if (idx >= 0) {
      setSelectedIndex(idx);
    }
  }, [activeNetwork, isReady]);

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
    if (isMobile) scrollToCenter(index);
  };

  const goLeft = () => {
    if (selectedIndex > 0) handleSelect(selectedIndex - 1);
  };

  const goRight = () => {
    if (selectedIndex < supportedNetworks.length - 1) handleSelect(selectedIndex + 1);
  };

  if (!isReady) {
    return <div className={styles.loading}>Loading networks...</div>;
  }

  return (
    <div className={styles.selectorContainer}>
      <div className={styles.arrows}>
        <button className={styles.arrowBtn} onClick={goLeft} disabled={selectedIndex === 0}>
          ←
        </button>
        <button className={styles.arrowBtn} onClick={goRight} disabled={selectedIndex === supportedNetworks.length - 1}>
          →
        </button>
      </div>

      <div
        ref={containerRef}
        className={isMobile ? styles.scrollableWrapper : styles.staticWrapper}
        style={isMobile ? { touchAction: "pan-x", overflowX: "auto", scrollBehavior: "smooth" } : {}}
      >
        {supportedNetworks.map((net, index) => (
          <motion.div
            key={net.symbol}
            className={`${styles.card} ${selectedIndex === index ? styles.selected : ""}`}
            onClick={() => handleSelect(index)}
            whileTap={{ scale: 0.95 }}
            role="button"
            tabIndex={0}
          >
            <Image
              src={net.logo}
              alt={`${net.name} logo`}
              width={60}
              height={60}
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

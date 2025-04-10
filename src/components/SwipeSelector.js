"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { useAuth } from "@/contexts/AuthContext";
import { useSwipeReady } from "@/hooks/useSwipeReady";
import styles from "@/components/swipeselector.module.css";

const supportedNetworks = [
  {
    name: "Ethereum",
    symbol: "eth",
    logo: "https://assets.coingecko.com/coins/images/279/large/ethereum.png",
  },
  {
    name: "BNB Chain",
    symbol: "bnb",
    logo: "https://assets.coingecko.com/coins/images/825/large/bnb-icon2_2x.png",
  },
  {
    name: "BNB Testnet",
    symbol: "tbnb",
    logo: "https://assets.coingecko.com/coins/images/825/large/bnb-icon2_2x.png",
  },
  {
    name: "Polygon",
    symbol: "matic",
    logo: "https://assets.coingecko.com/coins/images/4713/large/matic-token-icon.png",
  },
  {
    name: "Avalanche",
    symbol: "avax",
    logo: "https://assets.coingecko.com/coins/images/12559/large/Avalanche_Circle_RedWhite_Logo.png",
  },
];

export default function SwipeSelector({ onSelect }) {
  const { activeNetwork, setActiveNetwork } = useAuth();
  const containerRef = useRef(null);
  const [selectedIndex, setSelectedIndex] = useState(1);
  const [isMobile, setIsMobile] = useState(false);
  const hasInitialized = useRef(false);
  const isSwipeReady = useSwipeReady();

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 1024);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (!isSwipeReady || hasInitialized.current) return;
    if (supportedNetworks[selectedIndex]) {
      const selectedSymbol = supportedNetworks[selectedIndex].symbol;
      setActiveNetwork(selectedSymbol);
      onSelect?.(selectedSymbol);
      hasInitialized.current = true;
    }
    if (isMobile) scrollToCenter(selectedIndex);
  }, [isSwipeReady, isMobile, selectedIndex, setActiveNetwork, onSelect]);

  useEffect(() => {
    if (!isSwipeReady) return;
    const idx = supportedNetworks.findIndex((net) => net.symbol === activeNetwork);
    if (idx >= 0 && idx !== selectedIndex) {
      setSelectedIndex(idx);
    }
  }, [activeNetwork, isSwipeReady]);

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
    const selectedSymbol = supportedNetworks[index].symbol;
    setActiveNetwork(selectedSymbol);
    onSelect?.(selectedSymbol);

    if (typeof window !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate(10);
    }

    if (isMobile) scrollToCenter(index);
  };

  const goLeft = () => {
    if (selectedIndex > 0) handleSelect(selectedIndex - 1);
  };

  const goRight = () => {
    if (selectedIndex < supportedNetworks.length - 1) handleSelect(selectedIndex + 1);
  };

  if (!isSwipeReady) {
    return <div className={styles.loading}>Loading networks...</div>;
  }

  return (
    <div className={styles.selectorContainer}>
      <div className={styles.arrows}>
        <button className={styles.arrowBtn} onClick={goLeft} disabled={selectedIndex === 0}>
          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <button className={styles.arrowBtn} onClick={goRight} disabled={selectedIndex === supportedNetworks.length - 1}>
          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      </div>

      <div
        ref={containerRef}
        className={isMobile ? styles.scrollableWrapper : styles.staticWrapper}
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

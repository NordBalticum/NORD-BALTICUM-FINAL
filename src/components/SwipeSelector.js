// src/components/SwipeSelector.js
"use client";

import {
  useEffect,
  useRef,
  useState,
  useCallback,
  useMemo,
} from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { useNetwork } from "@/contexts/NetworkContext";
import { useSystemReady } from "@/hooks/useSystemReady";
import styles from "@/components/swipeselector.module.css";

// 🎯 Supported networks (keep in sync with NetworkContext.SUPPORTED_NETWORKS)
const supportedNetworks = [
  { name: "Ethereum", symbol: "eth", logo: "/icons/eth.svg" },
  { name: "BNB Chain", symbol: "bnb", logo: "/icons/bnb.svg" },
  { name: "BNB Testnet", symbol: "tbnb", logo: "/icons/bnb.svg" },
  { name: "Polygon", symbol: "matic", logo: "/icons/matic.svg" },
  { name: "Avalanche", symbol: "avax", logo: "/icons/avax.svg" },
];

export default function SwipeSelector({ onSelect }) {
  const { activeNetwork, switchNetwork } = useNetwork();
  const { ready } = useSystemReady();

  const containerRef = useRef(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  // Determine mobile layout
  useEffect(() => {
    const mql = window.matchMedia("(max-width:1024px)");
    const update = () => setIsMobile(mql.matches);
    mql.addEventListener("change", update);
    update();
    return () => mql.removeEventListener("change", update);
  }, []);

  // Initialize selectedIndex from activeNetwork once
  useEffect(() => {
    if (!ready) return;
    const idx = supportedNetworks.findIndex((n) => n.symbol === activeNetwork);
    if (idx >= 0) setSelectedIndex(idx);
  }, [activeNetwork, ready]);

  // Expose onSelect callback
  const notifySelect = useCallback(
    (idx) => {
      const sym = supportedNetworks[idx]?.symbol;
      switchNetwork(sym);
      onSelect?.(sym);
    },
    [switchNetwork, onSelect]
  );

  // Scroll container to center selected card
  const scrollToCenter = useCallback(
    (idx) => {
      const cont = containerRef.current;
      const card = cont?.children[idx];
      if (!cont || !card) return;
      const offset = card.offsetLeft - (cont.offsetWidth - card.offsetWidth) / 2;
      cont.scrollTo({ left: offset, behavior: "smooth" });
    },
    []
  );

  // When selection changes, scroll and vibrate
  useEffect(() => {
    if (!ready) return;
    scrollToCenter(selectedIndex);
    navigator.vibrate?.(10);
  }, [selectedIndex, ready, scrollToCenter]);

  // Handle arrow buttons
  const goLeft = useCallback(() => {
    setSelectedIndex((i) => Math.max(0, i - 1));
  }, []);
  const goRight = useCallback(() => {
    setSelectedIndex((i) => Math.min(supportedNetworks.length - 1, i + 1));
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "ArrowLeft") goLeft();
      if (e.key === "ArrowRight") goRight();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [goLeft, goRight]);

  if (!ready) {
    return (
      <div className={styles.loading}>
        <p>Loading networks...</p>
      </div>
    );
  }

  return (
    <div className={styles.selectorContainer} role="listbox" aria-label="Network selector">
      <div className={styles.arrows}>
        <button
          onClick={goLeft}
          disabled={selectedIndex === 0}
          aria-label="Previous network"
          className={styles.arrowBtn}
        >
          ‹
        </button>
        <button
          onClick={goRight}
          disabled={selectedIndex === supportedNetworks.length - 1}
          aria-label="Next network"
          className={styles.arrowBtn}
        >
          ›
        </button>
      </div>

      <div
        ref={containerRef}
        className={isMobile ? styles.scrollableWrapper : styles.staticWrapper}
      >
        {supportedNetworks.map((net, idx) => (
          <motion.div
            key={net.symbol}
            role="option"
            aria-selected={selectedIndex === idx}
            className={`${styles.card} ${
              selectedIndex === idx ? styles.selected : ""
            }`}
            onClick={() => {
              setSelectedIndex(idx);
              notifySelect(idx);
            }}
            whileTap={{ scale: 0.95 }}
            tabIndex={0}
          >
            <Image
              src={net.logo}
              alt={`${net.name} logo`}
              width={48}
              height={48}
              className={styles.logo}
              unoptimized
            />
            <span className={styles.name}>{net.name}</span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

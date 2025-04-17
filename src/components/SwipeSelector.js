"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { motion } from "framer-motion";
import Image from "next/image";

import { useNetwork } from "@/contexts/NetworkContext";
import { useSystemReady } from "@/contexts/SystemReadyContext"; // Dabar iš konteksto
import { useScale } from "@/hooks/useScale"; // Naudojame skalę

import styles from "@/styles/send.module.css"; // Dabar naudojame send.module.css

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
  const scale = useScale(); // Naudojame skalę

  const containerRef = useRef(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  // Determine mobile layout
  useEffect(() => {
    const mql = window.matchMedia("(max-width:1024px)");
    const handle = () => setIsMobile(mql.matches);
    mql.addEventListener("change", handle);
    handle();
    return () => mql.removeEventListener("change", handle);
  }, []);

  // Sync selectedIndex su activeNetwork
  useEffect(() => {
    if (!ready) return;
    const idx = supportedNetworks.findIndex((n) => n.symbol === activeNetwork);
    if (idx >= 0) setSelectedIndex(idx);
  }, [activeNetwork, ready]);

  // onSelect wrapper
  const notifySelect = useCallback(
    (idx) => {
      const sym = supportedNetworks[idx]?.symbol;
      if (sym && sym !== activeNetwork) {
        switchNetwork(sym);
        onSelect?.(sym);
      }
    },
    [activeNetwork, switchNetwork, onSelect]
  );

  // Scroll to center
  const scrollToCenter = useCallback((idx) => {
    const cont = containerRef.current;
    const card = cont?.children[idx];
    if (!cont || !card) return;
    const offset = card.offsetLeft - (cont.offsetWidth - card.offsetWidth) / 2;
    cont.scrollTo({ left: offset, behavior: "smooth" });
  }, []);

  // Kai keičiasi selectedIndex → scroll + vibrate
  useEffect(() => {
    if (!ready) return;
    scrollToCenter(selectedIndex);
    navigator.vibrate?.(10);
  }, [selectedIndex, ready, scrollToCenter]);

  // Arrow handlers
  const goLeft = useCallback(() => {
    setSelectedIndex((i) => Math.max(0, i - 1));
  }, []);
  const goRight = useCallback(() => {
    setSelectedIndex((i) => Math.min(supportedNetworks.length - 1, i + 1));
  }, []);

  // Keyboard nav
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
            className={`${styles.card} ${selectedIndex === idx ? styles.selected : ""}`}
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

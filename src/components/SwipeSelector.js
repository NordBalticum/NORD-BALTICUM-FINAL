"use client";

import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";

import { supportedNetworks } from "@/utils/networks";
import styles from "@/styles/swipe.module.css";

export default function SwipeSelector({ mode = "send", onSelect }) {
  const containerRef = useRef(null);
  const [selectedSymbol, setSelectedSymbol] = useState(supportedNetworks[0].symbol);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTo({ left: 0, behavior: "smooth" });
    }
    // Pasirinkimas paleidimo metu
    onSelect?.(supportedNetworks[0].symbol);
  }, []);

  const handleSelect = (symbol) => {
    setSelectedSymbol(symbol);
    if (typeof onSelect === "function") {
      onSelect(symbol);
    }
  };

  return (
    <div className={styles.swipeWrapper} ref={containerRef}>
      {supportedNetworks.map((net) => (
        <motion.div
          key={net.symbol}
          className={`${styles.card} ${
            selectedSymbol === net.symbol ? styles.selected : ""
          }`}
          whileTap={{ scale: 0.96 }}
          whileHover={{ scale: 1.05 }}
          onClick={() => handleSelect(net.symbol)}
        >
          <Image
            src={
              net.icon ||
              `https://cryptologos.cc/logos/${net.symbol.toLowerCase()}-${net.symbol.toLowerCase()}-logo.png`
            }
            alt={`${net.symbol} logo`}
            width={64}
            height={64}
            className={styles.logo}
            unoptimized
          />
          <div className={styles.name}>{net.name}</div>
        </motion.div>
      ))}
    </div>
  );
}

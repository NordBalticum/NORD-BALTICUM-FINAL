"use client";

import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";

import { supportedNetworks } from "@/utils/networks";
import styles from "@/components/swipeselector.module.css";

export default function SwipeSelector({ mode = "send", onSelect }) {
  const containerRef = useRef(null);
  const [selectedSymbol, setSelectedSymbol] = useState(supportedNetworks[0].symbol);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTo({ left: 0, behavior: "smooth" });
    }
  }, []);

  const handleSelect = (symbol, index) => {
    if (typeof onSelect === "function") {
      onSelect(symbol);
    }
    setSelectedSymbol(symbol);

    // Scroll selected into center view
    const cards = containerRef.current?.children;
    const selectedCard = cards?.[index];
    if (selectedCard && containerRef.current) {
      const container = containerRef.current;
      const offset = selectedCard.offsetLeft - container.offsetWidth / 2 + selectedCard.offsetWidth / 2;
      container.scrollTo({ left: offset, behavior: "smooth" });
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
    </div>
  );
}

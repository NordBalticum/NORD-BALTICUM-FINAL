"use client";

import React, { useEffect, useRef } from "react";
import Image from "next/image";
import { motion } from "framer-motion";

import { supportedNetworks } from "@/utils/networks";
import styles from "@/components/swipeselector.module.css";

export default function SwipeSelector({ mode = "send", onSelect }) {
  const containerRef = useRef(null);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTo({ left: 0, behavior: "smooth" });
    }
  }, []);

  const handleSelect = (symbol) => {
    if (typeof onSelect === "function") {
      onSelect(symbol);
    }
  };

  return (
    <div className={styles.selectorContainer}>
      <div className={styles.swipeWrapper} ref={containerRef}>
        {supportedNetworks.map((net) => (
          <motion.div
            key={net.symbol}
            className={styles.card}
            whileTap={{ scale: 0.95 }}
            whileHover={{ scale: 1.06 }}
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
    </div>
  );
}

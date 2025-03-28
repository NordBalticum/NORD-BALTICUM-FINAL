// components/SwipeSelector.js

import React from "react";
import { useRouter } from "next/router";
import { motion } from "framer-motion";
import styles from "../styles/swipe.module.css";
import { supportedNetworks } from "../utils/networks";

const SwipeSelector = ({ mode = "send" }) => {
  const router = useRouter();

  const handleSelect = (symbol) => {
    router.push(`/${mode}/${symbol}`);
  };

  return (
    <div className={styles.wrapper}>
      <h2 className={styles.title}>Select Network</h2>
      <p className={styles.subtext}>
        Swipe to choose the blockchain you want to {mode}
      </p>

      <div className={styles.swipeWrapper}>
        {supportedNetworks.map((network) => (
          <motion.div
            key={network.symbol}
            className={styles.card}
            whileTap={{ scale: 0.97 }}
            onClick={() => handleSelect(network.symbol)}
          >
            <img
              src={network.logo}
              alt={network.name}
              className={styles.logo}
            />
            <div className={styles.name}>{network.name}</div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default SwipeSelector;

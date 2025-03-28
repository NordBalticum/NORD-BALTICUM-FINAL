"use client";

import React from "react";
import Image from "next/image";
import { supportedNetworks } from "@/utils/networks";
import styles from "@/styles/swipe.module.css";

export default function SwipeSelector({ mode = "send", onSelect }) {
  return (
    <div className={styles.swipeWrapper}>
      {supportedNetworks.map((network) => (
        <div
          key={network.symbol}
          className={styles.card}
          onClick={() => onSelect(network.symbol)}
        >
          <Image
            src={network.icon}
            alt={network.symbol}
            width={48}
            height={48}
            className={styles.logo}
            unoptimized
          />
          <div className={styles.name}>
            {mode === "send" ? "Send" : "Receive"} {network.symbol}
          </div>
        </div>
      ))}
    </div>
  );
}

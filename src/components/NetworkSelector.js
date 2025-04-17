"use client";

import { useNetwork } from "@/contexts/NetworkContext";
import styles from "@/styles/networkSelector.module.css";

export default function NetworkSelector({ onSelect }) {
  const { activeNetwork, switchNetwork } = useNetwork();

  const handleSelect = (network) => {
    switchNetwork(network);
    onSelect(network);
  };

  return (
    <div className={styles.networkSelector}>
      <h3>Select Network</h3>
      <ul>
        <li onClick={() => handleSelect("eth")}>Ethereum</li>
        <li onClick={() => handleSelect("bnb")}>BNB Chain</li>
        <li onClick={() => handleSelect("matic")}>Polygon</li>
        <li onClick={() => handleSelect("avax")}>Avalanche</li>
      </ul>
    </div>
  );
}

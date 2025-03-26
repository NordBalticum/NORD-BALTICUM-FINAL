"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ethers } from "ethers";
import { useMagicLink } from "@/contexts/MagicLinkContext";
import { supabase } from "@/lib/supabaseClient";
import styles from "@/styles/swipe.module.css";
import BottomNavigation from "@/components/BottomNavigation";

const networks = [
  {
    name: "BNB Smart Chain",
    symbol: "BNB",
    route: "/bnb",
    icon: "https://cryptologos.cc/logos/bnb-bnb-logo.png",
  },
  {
    name: "BSC Testnet",
    symbol: "TBNB",
    route: "/tbnb",
    icon: "https://cryptologos.cc/logos/bnb-bnb-logo.png",
  },
  {
    name: "Ethereum",
    symbol: "ETH",
    route: "/eth",
    icon: "https://cryptologos.cc/logos/ethereum-eth-logo.png",
  },
  {
    name: "Polygon",
    symbol: "POL",
    route: "/pol",
    icon: "https://cryptologos.cc/logos/polygon-matic-logo.png",
  },
  {
    name: "Avalanche",
    symbol: "AVAX",
    route: "/avax",
    icon: "https://cryptologos.cc/logos/avalanche-avax-logo.png",
  },
  {
    name: "Solana",
    symbol: "SOL",
    route: "/sol",
    icon: "https://cryptologos.cc/logos/solana-sol-logo.png",
  },
];

export default function Send() {
  const { user } = useMagicLink();
  const router = useRouter();
  const [selected, setSelected] = useState(0);
  const [receiver, setReceiver] = useState("");
  const [amount, setAmount] = useState("");
  const [showModal, setShowModal] = useState(false);

  const handleSend = () => {
    if (!receiver || !amount) return alert("Please enter address and amount");
    setShowModal(true);
  };

  const confirmSend = () => {
    setShowModal(false);
    router.push(networks[selected].route);
  };

  if (!user) return <div className={styles.loading}>Loading Wallet...</div>;

  return (
    <div className="globalContainer">
      <div className={styles.swipeWrapper}>
        <h1 className={styles.title}>SEND CRYPTO</h1>
        <div className={styles.swipeWrapper}>
          {networks.map((net, index) => (
            <div
              key={net.symbol}
              className={styles.walletCard}
              onClick={() => setSelected(index)}
            >
              <div className={styles.walletHeader}>
                <span className={styles.walletName}>{net.name}</span>
                <span className={styles.walletBalance}>0.0000 {net.symbol}</span>
              </div>
              <img src={net.icon} alt={net.symbol} className={styles.icon} />
            </div>
          ))}
        </div>

        <div className={styles.walletActions}>
          <input
            type="text"
            placeholder="Receiver address"
            value={receiver}
            onChange={(e) => setReceiver(e.target.value)}
            className={styles.inputField}
          />
          <input
            type="number"
            placeholder="Amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className={styles.inputField}
          />
          <p>Estimated Fee: 0.003 {networks[selected].symbol}</p>
          <button onClick={handleSend} className={styles.confirmButton}>
            SEND
          </button>
        </div>
      </div>

      {showModal && (
        <div className={styles.confirmModal}>
          <div className={styles.modalTitle}>Confirm Transaction</div>
          <div className={styles.modalInfo}>
            <p><strong>Network:</strong> {networks[selected].name}</p>
            <p><strong>To:</strong> {receiver}</p>
            <p><strong>Amount:</strong> {amount} {networks[selected].symbol}</p>
            <p><strong>Fee:</strong> 0.003 {networks[selected].symbol}</p>
          </div>
          <div className={styles.modalActions}>
            <button className={styles.modalButton} onClick={confirmSend}>
              Confirm
            </button>
            <button
              className={`${styles.modalButton} ${styles.cancel}`}
              onClick={() => setShowModal(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <BottomNavigation />
    </div>
  );
}

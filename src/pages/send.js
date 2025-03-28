"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

import { useMagicLink } from "@/contexts/MagicLinkContext";
import { useWallet } from "@/contexts/WalletContext";

import BottomNavigation from "@/components/BottomNavigation";
import styles from "@/styles/swipe.module.css";

const networks = [
  {
    name: "BNB Smart Chain",
    symbol: "BNB",
    route: "/send/bnb",
    icon: "https://cryptologos.cc/logos/bnb-bnb-logo.png",
  },
  {
    name: "BSC Testnet",
    symbol: "TBNB",
    route: "/send/tbnb",
    icon: "https://cryptologos.cc/logos/binance-coin-bnb-logo.png",
  },
  {
    name: "Ethereum",
    symbol: "ETH",
    route: "/send/eth",
    icon: "https://cryptologos.cc/logos/ethereum-eth-logo.png",
  },
  {
    name: "Polygon",
    symbol: "POL",
    route: "/send/pol",
    icon: "https://cryptologos.cc/logos/polygon-matic-logo.png",
  },
  {
    name: "Avalanche",
    symbol: "AVAX",
    route: "/send/avax",
    icon: "https://cryptologos.cc/logos/avalanche-avax-logo.png",
  },
];

export default function Send() {
  const router = useRouter();
  const { user } = useMagicLink();
  const { wallet } = useWallet();

  const [selected, setSelected] = useState(0);
  const [receiver, setReceiver] = useState("");
  const [amount, setAmount] = useState("");
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (!user || !wallet?.address) router.push("/");
  }, [user, wallet]);

  const handleSend = () => {
    if (!receiver || !amount) return alert("Please enter both address and amount.");
    setShowModal(true);
  };

  const confirmSend = () => {
    setShowModal(false);
    router.push(networks[selected].route); // nukreipia į pasirinkto tinklo puslapį (pvz.: /send/bnb)
  };

  if (!user || !wallet?.address) {
    return <div className={styles.loading}>Loading Wallet...</div>;
  }

  return (
    <div className="globalContainer">
      <div className={styles.wrapper}>
        <h1 className={styles.title}>SEND CRYPTO</h1>
        <p className={styles.subtext}>Choose your network and enter details</p>

        <div className={styles.swipeWrapper}>
          {networks.map((net, index) => (
            <div
              key={net.symbol}
              className={`${styles.walletCard} ${selected === index ? styles.selected : ""}`}
              onClick={() => setSelected(index)}
            >
              <div className={styles.walletHeader}>
                <span className={styles.walletName}>{net.name}</span>
                <span className={styles.walletBalance}>0.0000 {net.symbol}</span>
              </div>
              <Image
                src={net.icon}
                alt={net.symbol}
                width={48}
                height={48}
                className={styles.icon}
                unoptimized
              />
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
          <p className={styles.feeInfo}>Estimated Fee: 0.003 {networks[selected].symbol}</p>
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
            <button className={`${styles.modalButton} ${styles.cancel}`} onClick={() => setShowModal(false)}>
              Cancel
            </button>
          </div>
        </div>
      )}

      <BottomNavigation />
    </div>
  );
}

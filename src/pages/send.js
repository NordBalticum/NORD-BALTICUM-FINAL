"use client";

import { useState } from "react";
import { useRouter } from "next/router";
import { useMagicLink } from "@/contexts/MagicLinkContext";
import { isValidAddress, sendBNB } from "@/lib/ethers";
import styles from "@/styles/send.module.css";
import BottomNavigation from "@/components/BottomNavigation";
import Select from "react-select";

// --- Custom Select Option su logotipu ir balansu ---
const CustomOption = ({ data, ...props }) => (
  <div {...props.innerRef} {...props.innerProps} className={styles.option}>
    <img src={data.icon} alt={data.symbol} className={styles.optionIcon} />
    <div>
      <div className={styles.optionLabel}>{data.label}</div>
      <div className={styles.optionBalance}>
        Balance: {data.balance} {data.symbol}
      </div>
    </div>
  </div>
);

export default function Send() {
  const router = useRouter();
  const { user, wallet } = useMagicLink();

  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [status, setStatus] = useState("");
  const [sending, setSending] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedNetwork, setSelectedNetwork] = useState(null);

  const adminWallet = process.env.NEXT_PUBLIC_ADMIN_WALLET;

  const networkOptions = [
    {
      value: "bsc",
      label: "BNB Smart Chain",
      symbol: "BNB",
      balance: "0.1502",
      icon: "https://cryptologos.cc/logos/bnb-bnb-logo.png",
    },
    {
      value: "bsctest",
      label: "BSC Testnet",
      symbol: "TBNB",
      balance: "9.2741",
      icon: "https://cryptologos.cc/logos/bnb-bnb-logo.png",
    },
    {
      value: "eth",
      label: "Ethereum Mainnet",
      symbol: "ETH",
      balance: "0.8823",
      icon: "https://cryptologos.cc/logos/ethereum-eth-logo.png",
    },
    {
      value: "polygon",
      label: "Polygon Mainnet",
      symbol: "MATIC",
      balance: "25.301",
      icon: "https://cryptologos.cc/logos/polygon-matic-logo.png",
    },
    {
      value: "avax",
      label: "Avalanche C-Chain",
      symbol: "AVAX",
      balance: "3.4478",
      icon: "https://cryptologos.cc/logos/avalanche-avax-logo.png",
    },
  ];

  const parsedAmount = parseFloat(amount);
  const feeAmount = parsedAmount ? parseFloat((parsedAmount * 0.03).toFixed(6)) : 0;
  const netAmount = parsedAmount ? parseFloat((parsedAmount - feeAmount).toFixed(6)) : 0;
  const currency = selectedNetwork?.symbol || "BNB";

  const handlePreview = () => {
    if (
      !wallet?.private_key ||
      !isValidAddress(recipient) ||
      !parsedAmount ||
      parsedAmount <= 0 ||
      !selectedNetwork
    ) {
      setStatus("❌ Please enter all required data.");
      return;
    }
    setShowModal(true);
  };

  const handleSend = async () => {
    setSending(true);
    setStatus("⏳ Sending... Please wait.");
    setShowModal(false);

    try {
      await sendBNB(wallet.private_key, recipient, netAmount, selectedNetwork.value);
      await sendBNB(wallet.private_key, adminWallet, feeAmount, selectedNetwork.value);

      setStatus(`✅ Sent ${netAmount} ${currency}. Fee: ${feeAmount} ${currency}.`);
      setRecipient("");
      setAmount("");
    } catch (err) {
      console.error("❌ Send failed:", err);
      setStatus("❌ Transaction failed. Please try again.");
    } finally {
      setSending(false);
    }
  };

  if (!user || !wallet) return <div className={styles.loading}>Loading Wallet...</div>;

  return (
    <div className="globalContainer">
      <div className={styles.wrapper}>
        <h1 className={styles.title}>Send To</h1>
        <p className={styles.networkText}>
          {selectedNetwork ? selectedNetwork.label : "Select Network"}
        </p>

        <div className={styles.card}>
          {/* FROM BLOCK */}
          <div className={styles.fromBlock}>
            <strong>From:</strong> {wallet.address}
            {selectedNetwork && (
              <span className={styles.fromBalance}>
                Balance: {selectedNetwork.balance} {selectedNetwork.symbol}
              </span>
            )}
          </div>

          {/* NETWORK SELECT */}
          <Select
            className={styles.select}
            options={networkOptions}
            components={{ Option: CustomOption }}
            onChange={(option) => setSelectedNetwork(option)}
            placeholder="Choose Network"
            isDisabled={sending}
          />

          {/* TO ADDRESS */}
          <input
            className={styles.input}
            type="text"
            placeholder="Recipient address"
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            disabled={sending}
          />

          {/* AMOUNT */}
          <input
            className={styles.input}
            type="number"
            placeholder={`Amount (${currency})`}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            disabled={sending}
          />

          {/* Preview Button */}
          <button
            className={styles.sendButton}
            onClick={handlePreview}
            disabled={sending}
          >
            Preview Transaction
          </button>

          {/* Live Status */}
          {status && (
            <p className={status.startsWith("✅") ? styles.success : styles.error}>
              {status}
            </p>
          )}
        </div>
      </div>

      {/* MODAL */}
      {showModal && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <h2>Transaction Preview</h2>
            <p><strong>To:</strong> {recipient}</p>
            <p><strong>Amount:</strong> {netAmount} {currency}</p>
            <p><strong>Fee:</strong> {feeAmount} {currency}</p>
            <button
              onClick={handleSend}
              className={styles.sendButton}
              disabled={sending}
            >
              Confirm & Send
            </button>
            <button
              onClick={() => setShowModal(false)}
              className={styles.cancelButton}
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

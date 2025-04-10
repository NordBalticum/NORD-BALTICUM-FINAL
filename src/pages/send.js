"use client";

import { useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ethers } from "ethers";
import { supabase } from "@/utils/supabaseClient";
import { useAuth } from "@/contexts/AuthContext";
import { useBalance } from "@/hooks/useBalance";
import { usePageReady } from "@/hooks/usePageReady";
import { useSwipeReady } from "@/hooks/useSwipeReady";
import { usePrices } from "@/hooks/usePrices";
import { useDebounce } from "@/hooks/useDebounce";
import { useTotalFeeCalculator } from "@/hooks/useTotalFeeCalculator";
import MiniLoadingSpinner from "@/components/MiniLoadingSpinner";
import SwipeSelector from "@/components/SwipeSelector";
import SuccessModal from "@/components/modals/SuccessModal";
import ErrorModal from "@/components/modals/ErrorModal";
import { toast } from "react-hot-toast";

import styles from "@/styles/send.module.css";
import background from "@/styles/background.module.css";

// ✅ Tinklų pasirinkimai
const networkOptions = [
  { key: "ethereum", label: "Ethereum" },
  { key: "bsc", label: "BNB" },
  { key: "tbnb", label: "Testnet BNB" },
  { key: "polygon", label: "Polygon" },
  { key: "avalanche", label: "Avalanche" },
];

// ✅ Tinklų trumpiniai
const networkShortNames = {
  ethereum: "ETH",
  bsc: "BNB",
  tbnb: "tBNB",
  polygon: "MATIC",
  avalanche: "AVAX",
};

// ✅ Tinklų spalvos
const buttonColors = {
  ethereum: "#0072ff",
  bsc: "#f0b90b",
  tbnb: "#f0b90b",
  polygon: "#8247e5",
  avalanche: "#e84142",
};

// ✅ Minimalūs siunčiami kiekiai
const minAmounts = {
  ethereum: 0.001,
  bsc: 0.0005,
  tbnb: 0.0005,
  polygon: 0.1,
  avalanche: 0.01,
};

// ✅ RPC URL'ai
const RPC_URLS = {
  ethereum: process.env.NEXT_PUBLIC_ETH_RPC_URL,
  bsc: process.env.NEXT_PUBLIC_BSC_RPC_URL,
  tbnb: process.env.NEXT_PUBLIC_TBSC_RPC_URL,
  polygon: process.env.NEXT_PUBLIC_POLYGON_RPC_URL,
  avalanche: process.env.NEXT_PUBLIC_AVALANCHE_RPC_URL,
};

// ✅ Tinklų logotipai toast'ui
const networkIcons = {
  ethereum: "https://cryptologos.cc/logos/ethereum-eth-logo.png",
  bsc: "https://cryptologos.cc/logos/binance-coin-bnb-logo.png",
  tbnb: "https://cryptologos.cc/logos/binance-coin-bnb-logo.png",
  polygon: "https://cryptologos.cc/logos/polygon-matic-logo.png",
  avalanche: "https://cryptologos.cc/logos/avalanche-avax-logo.png",
};

// ✅ Toast funkcija
function showToast(network, message) {
  toast.custom((t) => (
    <div
      style={{
        background: "#111",
        borderRadius: "12px",
        padding: "1rem",
        display: "flex",
        alignItems: "center",
        gap: "1rem",
        color: "#fff",
        boxShadow: "0 0 20px rgba(0,255,255,0.2)",
        fontSize: "0.9rem",
      }}
    >
      <img
        src={networkIcons[network] || networkIcons["bsc"]}
        alt="network"
        style={{ width: "28px", height: "28px", borderRadius: "50%" }}
      />
      <div>{message}</div>
    </div>
  ));
}

// ✅ Pagrindinis komponentas
export default function SendPage() {
  const router = useRouter();
  const { user, wallet, loading: authLoading } = useAuth();
  const { balances, initialLoading } = useBalance();
  const { prices } = usePrices();
  const isReady = usePageReady();
  const swipeReady = useSwipeReady();

  const [network, setNetwork] = useState("bsc");
  const [receiver, setReceiver] = useState("");
  const [amount, setAmount] = useState("");
  const [sending, setSending] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState(null);
  const [transactionHash, setTransactionHash] = useState(null);

  const shortName = useMemo(() => networkShortNames[network] || network.toUpperCase(), [network]);
  const parsedAmount = useMemo(() => Number(amount) || 0, [amount]);
  const debouncedAmount = useDebounce(parsedAmount, 400);

  const { gasFee, adminFee, totalFee, loading: feeLoading, error: feeError } = useTotalFeeCalculator(network, debouncedAmount);

  const netBalance = useMemo(() => balances?.[network]?.balance ? parseFloat(balances[network].balance) : 0, [balances, network]);

  const usdValue = useMemo(() => {
    const price = prices?.[network]?.usd || 0;
    return (netBalance * price).toFixed(2);
  }, [netBalance, prices, network]);

  const eurValue = useMemo(() => {
    const price = prices?.[network]?.eur || 0;
    return (netBalance * price).toFixed(2);
  }, [netBalance, prices, network]);

  const isValidAddress = (address) => /^0x[a-fA-F0-9]{40}$/.test(address.trim());

  const handleNetworkChange = useCallback((selectedNetwork) => {
    if (!selectedNetwork) return;
    setNetwork(selectedNetwork);
    setAmount("");
    setReceiver("");
    showToast(selectedNetwork, `Switched to ${networkShortNames[selectedNetwork]}`);
  }, []);

  const handleSend = () => {
    if (!isValidAddress(receiver)) {
      toast.error("❌ Invalid wallet address.");
      return;
    }
    if (parsedAmount < minAmounts[network]) {
      toast.error(`❌ Minimum to send is ${minAmounts[network]} ${shortName}`);
      return;
    }
    if (parsedAmount + totalFee > netBalance) {
      toast.error(`❌ Insufficient balance.`);
      return;
    }
    setShowConfirm(true);
  };

  const confirmSend = async () => {
    setShowConfirm(false);
    setSending(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from("wallets")
        .select("encrypted_key")
        .eq("user_email", user.email)
        .single();

      if (error || !data?.encrypted_key) {
        throw new Error("Failed to retrieve wallet.");
      }

      const decryptedPrivateKey = await decryptPrivateKey(data.encrypted_key);
      const provider = new ethers.JsonRpcProvider(RPC_URLS[network]);
      const signer = new ethers.Wallet(decryptedPrivateKey, provider);

      const tx = await signer.sendTransaction({
        to: receiver.trim().toLowerCase(),
        value: ethers.parseEther(amount),
      });

      await tx.wait();
      setTransactionHash(tx.hash);
      setShowSuccess(true);
      setReceiver("");
      setAmount("");
      showToast(network, "✅ Transaction Sent Successfully!");
    } catch (err) {
      console.error("❌ Send error:", err?.message || err);
      setError(err?.message || "Transaction failed.");
    } finally {
      setSending(false);
    }
  };

  const handleRetry = () => setError(null);

  if (!isReady || !swipeReady || initialLoading || authLoading || !wallet?.wallet?.address) {
    return (
      <div className={styles.loadingScreen}>
        <MiniLoadingSpinner />
      </div>
    );
  }

  const sendButtonStyle = {
    backgroundColor: buttonColors[network] || "#ffffff",
    color: network === "bsc" || network === "tbnb" ? "#000" : "#fff",
    border: "2px solid white",
    width: "100%",
    padding: "12px",
    fontSize: "18px",
    borderRadius: "12px",
    cursor: "pointer",
    transition: "background-color 0.3s ease, transform 0.3s ease",
    marginTop: "16px",
    boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
  };

  return (
    <main className={`${styles.main} ${background.gradient}`}>
      <div className={styles.wrapper}>
        <SwipeSelector options={networkOptions} selected={network} onSelect={handleNetworkChange} />

        <div className={styles.balanceTable}>
          <p className={styles.whiteText}>Your Balance: <span className={styles.balanceAmount}>{netBalance.toFixed(6)} {shortName}</span></p>
          <p className={styles.whiteText}>≈ €{eurValue} | ${usdValue}</p>
        </div>

        <div className={styles.walletActions}>
          <input
            type="text"
            placeholder="Receiver address"
            value={receiver}
            onChange={(e) => setReceiver(e.target.value)}
            className={styles.inputField}
            disabled={sending}
          />
          <input
            type="number"
            placeholder="Amount to send"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className={styles.inputField}
            disabled={sending}
          />

          <div className={styles.feesInfo}>
            {feeLoading ? (
              <p className={styles.whiteText}>Calculating Fees...</p>
            ) : feeError ? (
              <p style={{ color: "red" }}>Failed to load fees.</p>
            ) : (
              <>
                <p className={styles.whiteText}>Estimated Total Fees: {(gasFee + adminFee).toFixed(6)} {shortName}</p>
                <p className={styles.minimumText}>Minimum to send: {minAmounts[network]} {shortName}</p>
              </>
            )}
          </div>

          <button
            onClick={handleSend}
            disabled={sending || feeLoading}
            style={sendButtonStyle}
          >
            {sending ? <MiniLoadingSpinner size={20} color="#fff" /> : "SEND NOW"}
          </button>
        </div>

        {/* Modals */}
        {showConfirm && (
          <div className={styles.overlay}>
            <div className={styles.confirmModal}>
              <div className={styles.modalTitle}>Confirm Transaction</div>
              <div className={styles.modalInfo}>
                <p><strong>Network:</strong> {shortName}</p>
                <p><strong>Receiver:</strong> {receiver}</p>
                <p><strong>Amount:</strong> {parsedAmount.toFixed(6)} {shortName}</p>
                <p><strong>Total Fees:</strong> {(gasFee + adminFee).toFixed(6)} {shortName}</p>
              </div>
              <div className={styles.modalActions}>
                <button className={styles.modalButton} onClick={confirmSend} disabled={sending}>
                  {sending ? "Confirming..." : "Confirm"}
                </button>
                <button className={`${styles.modalButton} ${styles.cancel}`} onClick={() => setShowConfirm(false)}>Cancel</button>
              </div>
            </div>
          </div>
        )}

        {showSuccess && transactionHash && (
          <SuccessModal
            message="✅ Transaction Successful!"
            onClose={() => setShowSuccess(false)}
            transactionHash={transactionHash}
            network={network}
          />
        )}

        {error && (
          <ErrorModal
            error={error}
            onRetry={handleRetry}
          />
        )}
      </div>
    </main>
  );
}

// ✅ Privatų raktą dešifruojanti funkcija
async function decryptPrivateKey(encryptedKey) {
  const encode = (str) => new TextEncoder().encode(str);
  const decode = (buf) => new TextDecoder().decode(buf);

  const keyMaterial = await window.crypto.subtle.importKey(
    "raw",
    encode(process.env.NEXT_PUBLIC_ENCRYPTION_SECRET),
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  );

  const key = await window.crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: encode("nordbalticum-salt"),
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );

  const { iv, data } = JSON.parse(atob(encryptedKey));

  const decrypted = await window.crypto.subtle.decrypt(
    { name: "AES-GCM", iv: new Uint8Array(iv) },
    key,
    new Uint8Array(data)
  );

  return decode(decrypted);
}

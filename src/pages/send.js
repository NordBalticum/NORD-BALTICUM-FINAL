"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useSend } from "@/contexts/SendContext";
import { useBalance } from "@/contexts/BalanceContext";
import { useNetwork } from "@/contexts/NetworkContext";
import { useAuth } from "@/contexts/AuthContext";
import { useSystemReady } from "@/hooks/useSystemReady";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Loader2, ChevronDown } from "lucide-react";
import * as Select from "@radix-ui/react-select";
import styles from "@/styles/send.module.css";

const networks = [
  { label: "Ethereum", value: "eth", color: "color-eth", icon: "/icons/eth.svg", min: 0.001 },
  { label: "Polygon", value: "polygon", color: "color-polygon", icon: "/icons/matic.svg", min: 0.1 },
  { label: "BNB", value: "bnb", color: "color-bnb", icon: "/icons/bnb.svg", min: 0.01 },
  { label: "Avalanche", value: "avax", color: "color-avax", icon: "/icons/avax.svg", min: 0.01 },
  { label: "Testnet BNB", value: "tbnb", color: "color-bnb", icon: "/icons/bnb.svg", min: 0.001 }
];

const coingeckoIds = {
  eth: "ethereum",
  polygon: "matic-network",
  bnb: "binancecoin",
  avax: "avalanche-2",
  tbnb: "binancecoin"
};

const isValidAddress = (addr) => /^0x[a-fA-F0-9]{40}$/.test(addr.trim());

const Logo = () => (
  <div className={styles.logoWrapper}>
    <img src="/icons/logo.svg" alt="Nord Balticum" className={styles.logoImage} />
  </div>
);

const Send = () => {
  const { user } = useAuth();
  const { balance } = useBalance();
  const { switchNetwork } = useNetwork();
  const { sendTransaction, sending, calculateFees, gasFee, adminFee, feeLoading } = useSend();
  const systemReady = useSystemReady();

  const [step, setStep] = useState(1);
  const [selectedNetwork, setSelectedNetwork] = useState("eth");
  const [to, setTo] = useState("");
  const [amount, setAmount] = useState("");
  const [txHash, setTxHash] = useState(null);
  const [lastSentTime, setLastSentTime] = useState(0);
  const [usdPrices, setUsdPrices] = useState({});

  const minAmount = useMemo(() => networks.find(n => n.value === selectedNetwork)?.min || 0, [selectedNetwork]);
  const currentColorClass = useMemo(() => networks.find(n => n.value === selectedNetwork)?.color || "bg-gray-500", [selectedNetwork]);
  const usdRate = usdPrices[coingeckoIds[selectedNetwork]]?.usd || 0;
  const usdValue = useMemo(() => amount && usdRate ? (Number(amount) * usdRate).toFixed(2) : null, [amount, usdRate]);
  const currentBalance = useMemo(() => (balance?.[selectedNetwork] || 0).toFixed(6), [balance, selectedNetwork]);

  useEffect(() => {
  const fetchPrices = async () => {
    try {
      const ids = Object.values(coingeckoIds).join(",");
      const res = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd`);
      const data = await res.json();
      setUsdPrices(data);
    } catch (err) {
      console.error("USD fetch error:", err);
    }
  };
  fetchPrices();
}, []); // Tik kartą!
  
  useEffect(() => {
    if (step === 3) calculateFees(amount);
  }, [step, amount, calculateFees]);

  const handleMax = useCallback(() => {
    if (balance?.[selectedNetwork]) {
      setAmount(Number(balance[selectedNetwork]).toFixed(6));
    }
  }, [balance, selectedNetwork]);

  const handleSelectNetwork = useCallback(async (value) => {
  setStep(2); // visada pereina į Step 2
  setSelectedNetwork(value); // visada atnaujina, nepriklausomai ar tas pats
  if (value !== selectedNetwork) {
    await switchNetwork(value);
  }
}, [selectedNetwork, switchNetwork]);

  const handleSend = async () => {
    const now = Date.now();
    const cleanTo = to.trim().toLowerCase();
    const parsedAmount = Number(amount);
    const bal = Number(balance?.[selectedNetwork] || 0);

    if (!isValidAddress(cleanTo)) return alert("❌ Invalid address.");
    if (now - lastSentTime < 10000) return alert("⚠️ Please wait before sending again.");
    if (parsedAmount < minAmount) return alert(`Min: ${minAmount} ${selectedNetwork.toUpperCase()}`);
    if (parsedAmount > bal) return alert("❌ Insufficient balance.");

    try {
      const hash = await sendTransaction({ to: cleanTo, amount, userEmail: user.email });
      if (!hash) throw new Error("❌ No transaction hash returned");
      setTxHash(hash);
      setLastSentTime(now);
      setStep(5);
    } catch (err) {
      console.error("TX ERROR:", err);
      alert("❌ " + (err.message || "Transaction failed"));
    }
  };

  if (!systemReady) {
    return (
      <div className="flex items-center justify-center h-screen text-white">
        <Loader2 className="animate-spin mr-2" />
        Preparing system...
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <Card className={`${styles.card} pt-16`}>
        <CardContent className="space-y-10 p-8">
          {step === 1 && (
            <div className="space-y-8">
              <Logo />
              <h2 className={styles.stepTitle}>Select Active Network</h2>
              <Select.Root value={selectedNetwork} onValueChange={handleSelectNetwork}>
                <Select.Trigger className={styles.selectTrigger}>
                  <div className={styles.selectValueWrapper}>
                    <img src={networks.find(n => n.value === selectedNetwork)?.icon} alt="net" className={styles.selectIcon} />
                    <Select.Value placeholder="Select network" />
                  </div>
                  <Select.Icon>
                    <ChevronDown size={18} />
                  </Select.Icon>
                </Select.Trigger>
                <Select.Portal>
                  <Select.Content className="z-50 bg-black border border-neutral-700 rounded-xl shadow-2xl" position="popper" sideOffset={5}>
                    <Select.Viewport>
                      {networks.map(net => (
                        <Select.Item key={net.value} value={net.value} className={styles.selectItem}>
                          <img src={net.icon} alt={net.label} className={styles.selectIcon} />
                          <Select.ItemText>{net.label}</Select.ItemText>
                        </Select.Item>
                      ))}
                    </Select.Viewport>
                  </Select.Content>
                </Select.Portal>
              </Select.Root>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-8">
              <Logo />
              <h2 className={styles.stepTitle}>Recipient Address</h2>
              <div className={styles.inputWrapper}>
                <Input value={to} onChange={(e) => setTo(e.target.value)} placeholder="0x... address" className="pr-14" />
              </div>
              <div className={styles.buttonsRow}>
                <Button onClick={() => setStep(1)} className={`${styles.btn} ${styles[currentColorClass]}`}>Back</Button>
                <Button onClick={() => setStep(3)} className={`${styles.btn} ${styles[currentColorClass]}`} disabled={!to}>Next</Button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-8">
              <Logo />
              <h2 className={styles.stepTitle}>Enter Amount</h2>
              <div className={styles.inputWrapper}>
                <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Amount" className="text-center text-xl pr-14" />
                <Button size="sm" onClick={handleMax} className={styles.inputAddonRight}>Max</Button>
              </div>
              {usdValue && <p className="text-sm text-center text-gray-400">≈ ${usdValue}</p>}
              <p className="text-xs text-center text-gray-400">Balance: {currentBalance} {selectedNetwork.toUpperCase()}</p>
              <p className="text-xs text-center text-red-400 font-medium">Min. amount: {minAmount} {selectedNetwork.toUpperCase()}</p>
              <div className={styles.buttonsRow}>
                <Button onClick={() => setStep(2)} className={`${styles.btn} ${styles[currentColorClass]}`}>Back</Button>
                <Button onClick={() => setStep(4)} className={`${styles.btn} ${styles[currentColorClass]}`} disabled={!amount || Number(amount) < minAmount}>Next</Button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-8">
              <Logo />
              <h2 className={styles.stepTitle}>Confirm Transfer</h2>
              <div className={styles.confirmBox}>
                <p className={styles.amountDisplay}>{amount} {selectedNetwork.toUpperCase()}</p>
                <p className={styles.usdValue}>{usdValue ? `≈ $${usdValue}` : ""}</p>
                <div className={styles.confirmDetails}>
                  <p><b>To:</b> {to}</p>
                  <p><b>Network:</b> {selectedNetwork}</p>
                  <p><b>Fee:</b> {feeLoading ? "Calculating..." : `${(Number(gasFee) + Number(adminFee)).toFixed(6)} ${selectedNetwork.toUpperCase()}`}</p>
                </div>
              </div>
              <div className={styles.buttonsRow}>
                <Button onClick={() => setStep(3)} className={`${styles.btn} ${styles[currentColorClass]}`}>Back</Button>
                <Button onClick={handleSend} disabled={sending || feeLoading} className={`${styles.btn} ${styles[currentColorClass]}`}>
                  {sending ? <Loader2 className="animate-spin" /> : "Send"}
                </Button>
              </div>
            </div>
          )}

          {step === 5 && txHash && (
            <div className="text-center space-y-6">
              <h2 className={styles.successText}>✅ Sent!</h2>
              <p className={styles.txHashBox}>TX Hash:<br />{txHash}</p>
              <Button
                className={`${styles.btn} w-full mt-4`}
                onClick={() => {
                  setStep(1);
                  setTxHash(null);
                  setAmount("");
                  setTo("");
                }}
              >
                Send Another
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Send;

"use client";

import { useEffect, useState } from "react";
import { useSend } from "@/contexts/SendContext";
import { useBalance } from "@/contexts/BalanceContext";
import { useNetwork } from "@/contexts/NetworkContext";
import { useAuth } from "@/contexts/AuthContext";
import { useSystemReady } from "@/hooks/useSystemReady";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Loader2, QrCode, ChevronDown } from "lucide-react";
import * as Select from "@radix-ui/react-select";
import styles from "@/styles/sendtest.module.css";

const networks = [
  { label: "Ethereum", value: "eth", color: "color-eth", icon: "/icons/eth.svg", min: 0.001 },
  { label: "Polygon", value: "polygon", color: "color-polygon", icon: "/icons/matic.svg", min: 0.1 },
  { label: "BNB", value: "bnb", color: "color-bnb", icon: "/icons/bnb.svg", min: 0.01 },
  { label: "Avalanche", value: "avax", color: "color-avax", icon: "/icons/avax.svg", min: 0.01 },
];

const coingeckoIds = {
  eth: "ethereum",
  polygon: "matic-network",
  bnb: "binancecoin",
  avax: "avalanche-2",
};

const Logo = () => (
  <div className={styles.logoWrapper}>
    <img src="/icons/logo.svg" alt="Nord Balticum" className={styles.logoImage} />
  </div>
);

const SendTest = () => {
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

  useEffect(() => {
    if (step === 3) calculateFees(amount);
  }, [step, amount]);

  useEffect(() => {
    const fetchPrices = async () => {
      const ids = Object.values(coingeckoIds).join(",");
      try {
        const res = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd`);
        const data = await res.json();
        setUsdPrices(data);
      } catch (err) {
        console.error("USD fetch failed:", err);
      }
    };
    fetchPrices();
  }, [selectedNetwork]);

  const handleNetworkChange = (value) => {
    setSelectedNetwork(value);
    switchNetwork(value);
    setTimeout(() => setStep(2), 200);
  };

  const handleMax = () => {
    if (balance && balance[selectedNetwork]) {
      setAmount(balance[selectedNetwork].toString());
    }
  };

  const handleSend = async () => {
    const now = Date.now();
    const min = networks.find(n => n.value === selectedNetwork)?.min || 0;
    const currentBalance = Number(balance[selectedNetwork] || 0);
    const parsedAmount = Number(amount);

    if (now - lastSentTime < 10000) return alert("Please wait before sending again.");
    if (parsedAmount < min) return alert(`Minimum amount on ${selectedNetwork.toUpperCase()}: ${min}`);
    if (parsedAmount > currentBalance) return alert("Insufficient balance.");

    try {
      const hash = await sendTransaction({ to, amount, userEmail: user.email });
      setTxHash(hash);
      setLastSentTime(now);
      setStep(5);
    } catch (err) {
      console.error("TX Error:", err);
    }
  };

  const currentColorClass = networks.find(n => n.value === selectedNetwork)?.color || "bg-gray-500";
  const minAmount = networks.find(n => n.value === selectedNetwork)?.min || 0;
  const usdRate = usdPrices[coingeckoIds[selectedNetwork]]?.usd || null;
  const usdEstimate = usdRate && amount ? (Number(amount) * usdRate).toFixed(2) : null;
  const currentBalance = (balance[selectedNetwork] || 0).toFixed(6);

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
              <h2 className={styles.stepTitle}>Select Network</h2>
              <Select.Root value={selectedNetwork} onValueChange={handleNetworkChange}>
                <Select.Trigger className={styles.selectTrigger}>
                  <Select.Value placeholder="Select network..." />
                  <Select.Icon><ChevronDown size={18} /></Select.Icon>
                </Select.Trigger>
                <Select.Portal>
                  <Select.Content className="z-50 bg-black border border-neutral-700 rounded-xl shadow-2xl animate-fade-in" position="popper">
                    {networks.map(net => (
                      <Select.Item key={net.value} value={net.value} className={styles.selectItem}>
                        <img src={net.icon} alt={net.label} className={styles.selectIcon} />
                        <Select.ItemText>{net.label}</Select.ItemText>
                      </Select.Item>
                    ))}
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
                <Input
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  placeholder="0x... address"
                  className="pr-14"
                />
                <Button variant="ghost" className={styles.inputAddonRight}>
                  <QrCode size={18} />
                </Button>
              </div>
              <div className={styles.buttonsRow}>
                <Button className={`${styles.btn} ${styles[currentColorClass]}`} onClick={() => setStep(1)}>Back</Button>
                <Button className={`${styles.btn} ${styles[currentColorClass]}`} onClick={() => setStep(3)} disabled={!to}>Next</Button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-8">
              <Logo />
              <h2 className={styles.stepTitle}>Enter Amount</h2>
              <div className={styles.inputWrapper}>
                <Input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Amount"
                  className="text-center text-xl pr-14"
                />
                <Button size="sm" onClick={handleMax} className={styles.inputAddonRight}>Max</Button>
              </div>
              <p className="text-sm text-center text-gray-400">
                {usdEstimate ? `≈ $${usdEstimate}` : "USD estimate"}
              </p>
              <p className="text-xs text-center text-gray-400">
                Balance: {currentBalance} {selectedNetwork.toUpperCase()}
              </p>
              <p className="text-xs text-center text-red-400 font-medium">
                Min. amount: {minAmount} {selectedNetwork.toUpperCase()}
              </p>
              <div className={styles.buttonsRow}>
                <Button className={`${styles.btn} ${styles[currentColorClass]}`} onClick={() => setStep(2)}>Back</Button>
                <Button className={`${styles.btn} ${styles[currentColorClass]}`} onClick={() => setStep(4)} disabled={!amount || Number(amount) < minAmount}>
                  Next
                </Button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-8">
              <Logo />
              <h2 className={styles.stepTitle}>Confirm Transfer</h2>
              <div className={styles.confirmBox}>
                <p className={styles.amountDisplay}>{amount} {selectedNetwork.toUpperCase()}</p>
                <p className={styles.usdValue}>
                  {usdEstimate ? `≈ $${usdEstimate}` : ""}
                </p>
                <div className={styles.confirmDetails}>
                  <p><b>To:</b> {to}</p>
                  <p><b>Network:</b> {selectedNetwork}</p>
                  <p><b>Fee:</b> {feeLoading ? "Calculating..." : `${(Number(gasFee) + Number(adminFee)).toFixed(6)} ${selectedNetwork.toUpperCase()}`}</p>
                </div>
              </div>
              <div className={styles.buttonsRow}>
                <Button className={`${styles.btn} ${styles[currentColorClass]}`} onClick={() => setStep(3)}>Back</Button>
                <Button className={`${styles.btn} ${styles[currentColorClass]}`} onClick={handleSend} disabled={sending || feeLoading}>
                  {sending ? <Loader2 className="animate-spin" /> : "Send"}
                </Button>
              </div>
            </div>
          )}

          {step === 5 && txHash && (
            <div className="text-center space-y-4">
              <h2 className={styles.successText}>✅ Sent!</h2>
              <p className={styles.txHashBox}>TX Hash:<br />{txHash}</p>
              <Button className={`${styles.btn} w-full mt-4`} onClick={() => setStep(1)}>Send Another</Button>
            </div>
          )}

        </CardContent>
      </Card>
    </div>
  );
};

export default SendTest;

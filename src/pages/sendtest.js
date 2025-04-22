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
  { label: "Ethereum", value: "eth", color: "color-eth", icon: "/icons/eth.svg" },
  { label: "Polygon", value: "polygon", color: "color-polygon", icon: "/icons/matic.svg" },
  { label: "BNB", value: "bnb", color: "color-bnb", icon: "/icons/bnb.svg" },
  { label: "Avalanche", value: "avax", color: "color-avax", icon: "/icons/avax.svg" }
];

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

  useEffect(() => {
    if (step === 3) calculateFees(amount);
  }, [step, amount]);

  const handleNetworkChange = (value) => {
    setSelectedNetwork(value);
    switchNetwork(value);
    setTimeout(() => setStep(2), 250);
  };

  const handleMax = () => {
    if (balance && balance[selectedNetwork]) {
      setAmount(balance[selectedNetwork].toString());
    }
  };

  const handleSend = async () => {
    try {
      const hash = await sendTransaction({ to, amount, userEmail: user.email });
      setTxHash(hash);
      setStep(5);
    } catch (err) {
      console.error("TX Error:", err);
    }
  };

  const currentColorClass = networks.find(n => n.value === selectedNetwork)?.color || "bg-gray-500";

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
          {/* STEP 1: SELECT NETWORK */}
          {step === 1 && (
            <div className="space-y-8">
              <h2 className={styles.stepTitle}>Select Network</h2>
              <Select.Root value={selectedNetwork} onValueChange={handleNetworkChange}>
                <Select.Trigger className={styles.selectTrigger}>
                  <Select.Value placeholder="Select network..." />
                  <Select.Icon><ChevronDown size={18} /></Select.Icon>
                </Select.Trigger>
                <Select.Portal>
                  <Select.Content className="z-50 bg-black border border-neutral-700 rounded-xl shadow-2xl animate-fade-in">
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

          {/* STEP 2: RECIPIENT ADDRESS */}
          {step === 2 && (
            <div className="space-y-8">
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
                <Button onClick={() => setStep(1)} className={`w-1/2 ${styles[currentColorClass]}`}>Back</Button>
                <Button onClick={() => setStep(3)} className={`w-1/2 ${styles[currentColorClass]}`}>Next</Button>
              </div>
            </div>
          )}

          {/* STEP 3: ENTER AMOUNT */}
          {step === 3 && (
            <div className="space-y-8">
              <h2 className={styles.stepTitle}>Enter Amount</h2>
              <div className={styles.inputWrapper}>
                <Input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Amount"
                  className="text-center text-xl pr-14"
                />
                <Button size="sm" onClick={handleMax} className={styles.inputAddonRight}>
                  Max
                </Button>
              </div>
              <p className="text-sm text-center text-gray-400">
                ≈ {amount ? `${(Number(amount) * 1.2).toFixed(2)} $ | €` : "€ | $ estimate"}
              </p>
              <div className={styles.buttonsRow}>
                <Button onClick={() => setStep(2)} className={`w-1/2 ${styles[currentColorClass]}`}>Back</Button>
                <Button onClick={() => setStep(4)} className={`w-1/2 ${styles[currentColorClass]}`}>Next</Button>
              </div>
            </div>
          )}

          {/* STEP 4: CONFIRM TRANSFER */}
          {step === 4 && (
            <div className="space-y-8">
              <h2 className={styles.stepTitle}>Confirm Transfer</h2>
              <div className={styles.confirmBox}>
                <p className={styles.amountDisplay}>{amount} {selectedNetwork.toUpperCase()}</p>
                <p className={styles.usdValue}>
                  ≈ {(Number(amount) * 1.2).toFixed(2)} $ | €
                </p>
                <div className={styles.confirmDetails}>
                  <p><b>To:</b> {to}</p>
                  <p><b>Network:</b> {selectedNetwork}</p>
                  <p><b>Fee:</b> {feeLoading
                    ? "Calculating..."
                    : `${(Number(gasFee) + Number(adminFee)).toFixed(6)} ${selectedNetwork.toUpperCase()}`}
                  </p>
                </div>
              </div>
              <div className={styles.buttonsRow}>
                <Button onClick={() => setStep(3)} className={`w-1/2 ${styles[currentColorClass]}`}>Back</Button>
                <Button
                  onClick={handleSend}
                  disabled={sending || feeLoading}
                  className={`w-1/2 ${styles[currentColorClass]}`}
                >
                  {sending ? <Loader2 className="animate-spin" /> : "Send"}
                </Button>
              </div>
            </div>
          )}

          {/* STEP 5: SUCCESS */}
          {step === 5 && txHash && (
            <div className="text-center space-y-4">
              <h2 className={styles.successText}>✅ Sent!</h2>
              <p className={styles.txHashBox}>
                TX Hash:<br />{txHash}
              </p>
              <Button onClick={() => setStep(1)} className="w-full mt-4">Send Another</Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SendTest;

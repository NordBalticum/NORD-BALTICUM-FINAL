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
  { label: "Polygon",  value: "polygon", color: "color-polygon", icon: "/icons/matic.svg", min: 0.1 },
  { label: "BNB",      value: "bnb", color: "color-bnb", icon: "/icons/bnb.svg", min: 0.01 },
  { label: "Avalanche",value: "avax", color: "color-avax", icon: "/icons/avax.svg", min: 0.01 },
  { label: "Testnet BNB", value: "tbnb", color: "color-bnb", icon: "/icons/bnb.svg", min: 0.001 },
];

const coingeckoIds = {
  eth: "ethereum",
  polygon: "matic-network",
  bnb: "binancecoin",
  avax: "avalanche-2",
  tbnb: "binancecoin",
};
const isValidAddress = a => /^0x[a-fA-F0-9]{40}$/.test(a.trim());

const Logo = () => (
  <div className={styles.logoWrapper}>
    <img src="/icons/logo.svg" alt="Nord Balticum" className={styles.logoImage} />
  </div>
);

export default function Send() {
  const { user } = useAuth();
  const { balances } = useBalance();
  const { switchNetwork } = useNetwork();
  const {
    sendTransaction,
    sending,
    calculateFees,
    gasFee,
    adminFee,
    totalFee,
    feeLoading,
    feeError
  } = useSend();
  const systemReady = useSystemReady();

  const [step, setStep] = useState(1);
  const [selectedNetwork, setSelectedNetwork] = useState("eth");
  const [to, setTo] = useState("");
  const [amount, setAmount] = useState("");
  const [txHash, setTxHash] = useState(null);
  const [lastSentTime, setLastSentTime] = useState(0);
  const [usdPrices, setUsdPrices] = useState({});

  // 1) min
  const minAmount = useMemo(
    () => networks.find(n => n.value === selectedNetwork)?.min || 0,
    [selectedNetwork]
  );
  // 2) button color
  const btnColor = useMemo(
    () => networks.find(n => n.value === selectedNetwork)?.color || "bg-gray-500",
    [selectedNetwork]
  );
  // 3) USD rate/value
  const usdRate = usdPrices[coingeckoIds[selectedNetwork]]?.usd || 0;
  const usdValue = useMemo(
    () => amount && usdRate ? (Number(amount) * usdRate).toFixed(2) : null,
    [amount, usdRate]
  );
  // 4) balance key
  const networkKey = useMemo(
    () => (selectedNetwork === "polygon" ? "matic" : selectedNetwork),
    [selectedNetwork]
  );
  // 5) on-chain balance
  const currentBalance = useMemo(() => {
    const b = balances?.[networkKey];
    return (typeof b === "number" ? b : 0).toFixed(6);
  }, [balances, networkKey]);

  // fetch USD prices once
  useEffect(() => {
    (async () => {
      try {
        const ids = Object.values(coingeckoIds).join(",");
        const res = await fetch(
          `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd`
        );
        setUsdPrices(await res.json());
      } catch {}
    })();
  }, []);

  // recalc fees on step 3 or 4, or whenever amount changes
  useEffect(() => {
    if ((step === 3 || step === 4) && Number(amount) > 0) {
      console.log("🔄 step, amount, to:", step, amount, to);
      console.log("🔄 calling calculateFees with:", amount);
      calculateFees(amount);
    }
  }, [step, amount, calculateFees, to]);

  const handleMax = useCallback(() => {
    const b = Number(balances?.[networkKey] || 0);
    setAmount(b.toFixed(6));
  }, [balances, networkKey]);

  const handleSelectNetwork = useCallback(
    async (value) => {
      setStep(2);
      if (value !== selectedNetwork) {
        await switchNetwork(value);
        setSelectedNetwork(value);
      }
    },
    [selectedNetwork, switchNetwork]
  );

  const handleSend = async () => {
    console.log("🔄 about to send tx to:", to, "amount:", amount);
    const now = Date.now();
    const toAddr = to.trim().toLowerCase();
    const val = Number(amount);
    const bal = Number(balances?.[networkKey] || 0);

    if (!isValidAddress(toAddr)) return alert("❌ Invalid address");
    if (now - lastSentTime < 10000) return alert("⚠️ Please wait before retrying");
    if (val < minAmount) return alert(`Min: ${minAmount} ${selectedNetwork}`);
    if (val > bal) return alert("❌ Insufficient balance");

    await switchNetwork(selectedNetwork);

    try {
      const hash = await sendTransaction({
        to: toAddr,
        amount,
        userEmail: user.email
      });
      console.log("🔄 tx sent, hash:", hash);
      setTxHash(hash);
      setLastSentTime(now);
      setStep(5);
    } catch (err) {
      console.error(err);
    }
  };

  if (!systemReady) {
    return (
      <div className="flex items-center justify-center h-screen text-white">
        <Loader2 className="animate-spin mr-2" /> Preparing…
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <Card className={`${styles.card} pt-16`}>
        <CardContent className="space-y-10 p-8">
          {/* STEP 1 */}
          {step === 1 && (
            <div className="space-y-8">
              <Logo />
              <h2 className={styles.stepTitle}>Select Active Network</h2>
              <Select.Root value={selectedNetwork} onValueChange={handleSelectNetwork}>
                <Select.Trigger className={styles.selectTrigger}>
                  <div className={styles.selectValueWrapper}>
                    <img
                      src={networks.find(n => n.value === selectedNetwork).icon}
                      alt={selectedNetwork}
                      className={styles.selectIcon}
                    />
                    <Select.Value placeholder="Select network" />
                  </div>
                  <Select.Icon>
                    <ChevronDown size={18} />
                  </Select.Icon>
                </Select.Trigger>
                <Select.Portal>
                  <Select.Content
                    className="z-50 bg-black border border-neutral-700 rounded-xl shadow-2xl"
                    position="popper"
                    sideOffset={5}
                  >
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

          {/* STEP 2 */}
          {step === 2 && (
            <div className="space-y-8">
              <Logo />
              <h2 className={styles.stepTitle}>Recipient Address</h2>
              <div className={styles.inputWrapper}>
                <Input
                  value={to}
                  onChange={e => setTo(e.target.value)}
                  placeholder="0x…"
                  className="pr-14"
                />
              </div>
              <div className={styles.buttonsRow}>
                <Button onClick={() => setStep(1)} className={`${styles.btn} ${styles[btnColor]}`}>
                  Back
                </Button>
                <Button onClick={() => setStep(3)} disabled={!to} className={`${styles.btn} ${styles[btnColor]}`}>
                  Next
                </Button>
              </div>
            </div>
          )}

          {/* STEP 3 */}
          {step === 3 && (
            <div className="space-y-8">
              <Logo />
              <h2 className={styles.stepTitle}>Enter Amount</h2>
              <div className={styles.inputWrapper}>
                <Input
                  type="number"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  placeholder="Amount"
                  className="text-center text-xl pr-14"
                />
                <Button size="sm" onClick={handleMax} className={styles.inputAddonRight}>
                  Max
                </Button>
              </div>
              {usdValue && <p className="text-sm text-center text-gray-400">≈ ${usdValue}</p>}
              <p className="text-xs text-center text-gray-400">
                Balance: {currentBalance} {selectedNetwork.toUpperCase()}
              </p>
              <p className="text-xs text-center text-red-400 font-medium">
                Min: {minAmount} {selectedNetwork.toUpperCase()}
              </p>
              <div className={styles.buttonsRow}>
                <Button onClick={() => setStep(2)} className={`${styles.btn} ${styles[btnColor]}`}>Back</Button>
                <Button onClick={() => setStep(4)} disabled={!amount || Number(amount) < minAmount} className={`${styles.btn} ${styles[btnColor]}`}>
                  Next
                </Button>
              </div>
            </div>
          )}

          {/* STEP 4 */}
          {step === 4 && (
            <div className="space-y-8">
              <Logo />
              <h2 className={styles.stepTitle}>Confirm Transfer</h2>
              {feeError && <p className="text-sm text-red-500">{feeError}</p>}
              <div className={styles.confirmBox}>
                <p className={styles.amountDisplay}>
                  {amount} {selectedNetwork.toUpperCase()}
                </p>
                <p className={styles.usdValue}>{usdValue ? `≈ $${usdValue}` : ""}</p>
                <div className={styles.confirmDetails}>
                  <p><b>To:</b> {to}</p>
                  <p><b>Network:</b> {selectedNetwork}</p>
                  <p><b>Gas Fee:</b> {feeLoading ? "..." : `${gasFee.toFixed(6)} ${selectedNetwork.toUpperCase()}`}</p>
                  <p><b>Admin Fee:</b> {feeLoading ? "..." : `${adminFee.toFixed(6)} ${selectedNetwork.toUpperCase()}`}</p>
                  <p><b>Total Fee:</b> {feeLoading ? "..." : `${totalFee.toFixed(6)} ${selectedNetwork.toUpperCase()}`}</p>
                </div>
              </div>
              <div className={styles.buttonsRow}>
                <Button onClick={() => setStep(3)} className={`${styles.btn} ${styles[btnColor]}`}>Back</Button>
                <Button onClick={handleSend} disabled={sending || feeLoading} className={`${styles.btn} ${styles[btnColor]}`}>
                  {sending ? <Loader2 className="animate-spin" /> : "Send"}
                </Button>
              </div>
            </div>
          )}

          {/* STEP 5 */}
          {step === 5 && txHash && (
            <div className="text-center space-y-6">
              <h2 className={styles.successText}>✅ Transaction Sent!</h2>
              <p className={styles.txHashBox}>
                TX Hash:<br />
                {txHash}
              </p>
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
}

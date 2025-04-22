"use client";

import { useEffect, useState } from "react";
import { useSend } from "@/contexts/SendContext";
import { useBalance } from "@/contexts/BalanceContext";
import { useNetwork } from "@/contexts/NetworkContext";
import { useAuth } from "@/contexts/AuthContext";
import { useSystemReady } from "@/hooks/useSystemReady";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Dialog, DialogContent } from "@/components/ui/Dialog";
import { Card, CardContent } from "@/components/ui/Card";
import { Loader2, QrCode } from "lucide-react";
import styles from "@/styles/sendtest.module.css";

const networks = [
  { label: "Ethereum", value: "eth", color: "bg-blue-500", icon: "/icons/eth.svg" },
  { label: "Polygon", value: "polygon", color: "bg-purple-500", icon: "/icons/polygon.svg" },
  { label: "BNB", value: "bnb", color: "bg-yellow-400", icon: "/icons/bnb.svg" },
  { label: "Avalanche", value: "avax", color: "bg-red-500", icon: "/icons/avax.svg" },
];

const SendTest = () => {
  const { user } = useAuth();
  const { balance } = useBalance();
  const { switchNetwork } = useNetwork();
  const {
    sendTransaction,
    sending,
    calculateFees,
    gasFee,
    adminFee,
    feeLoading,
  } = useSend();

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

  const currentColor = networks.find(n => n.value === selectedNetwork)?.color || "bg-gray-500";

  if (!systemReady) {
    return (
      <div className="flex items-center justify-center h-screen text-white">
        <Loader2 className="animate-spin mr-2" /> Preparing system...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-4 flex flex-col items-center justify-center">
      <Card className="w-full max-w-sm">
        <CardContent className="space-y-6 p-6">

          {step === 1 && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-center">Select Network</h2>
              <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
                {networks.map((net) => (
                  <Button
                    key={net.value}
                    variant={selectedNetwork === net.value ? "default" : "outline"}
                    className="w-full flex items-center justify-start gap-3 px-4 py-2"
                    onClick={() => handleNetworkChange(net.value)}
                  >
                    <img
                      src={net.icon}
                      alt={net.label}
                      className="networkIcon"
                    />
                    {net.label}
                  </Button>
                ))}
              </div>
              <Button onClick={() => setStep(2)} className="w-full mt-4">Next</Button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-center">Recipient Address</h2>
              <div className="flex items-center gap-2">
                <Input
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  placeholder="0x... address"
                />
                <Button variant="ghost">
                  <QrCode size={20} />
                </Button>
              </div>
              <Button onClick={() => setStep(3)} className="w-full mt-4">Next</Button>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-center">Enter Amount</h2>
              <div className="relative">
                <Input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Amount"
                  className="text-center text-xl"
                />
                <Button size="sm" onClick={handleMax} className="absolute left-2 top-2">Max</Button>
              </div>
              <p className="text-sm text-center text-gray-400">
                ≈ ${(Number(amount) * 1.2).toFixed(2)} (est.)
              </p>
              <Button onClick={() => setStep(4)} className="w-full mt-4">Next</Button>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-center">Confirm Transfer</h2>
              <div className="bg-zinc-900 rounded-xl p-4 space-y-2">
                <p className="text-center text-2xl font-bold">
                  {amount} {selectedNetwork.toUpperCase()}
                </p>
                <p className="text-center text-sm text-gray-400">
                  ≈ ${(Number(amount) * 1.2).toFixed(2)} USD
                </p>
                <div className="text-sm mt-4 space-y-1">
                  <p><b>To:</b> {to}</p>
                  <p><b>Network:</b> {selectedNetwork}</p>
                  <p><b>Fee:</b> {feeLoading
                    ? "Calculating..."
                    : `${(Number(gasFee) + Number(adminFee)).toFixed(6)} ${selectedNetwork.toUpperCase()}`}
                  </p>
                </div>
              </div>
              <Button
                onClick={handleSend}
                disabled={sending || feeLoading}
                className={`w-full mt-4 ${currentColor} text-black`}
              >
                {sending ? <Loader2 className="animate-spin" /> : "Send"}
              </Button>
            </div>
          )}

          {step === 5 && txHash && (
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold">✅ Sent!</h2>
              <p className="break-words text-sm">TX Hash:<br /> {txHash}</p>
              <Button onClick={() => setStep(1)} className="w-full mt-4">Send Another</Button>
            </div>
          )}

        </CardContent>
      </Card>
    </div>
  );
};

export default SendTest;

"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
} from "react";
import { ethers } from "ethers";
import { toast } from "react-toastify";
import { supabase } from "@/utils/supabaseClient";
import { useAuth } from "@/contexts/AuthContext";
import { useBalance } from "@/contexts/BalanceContext";
import { useNetwork } from "@/contexts/NetworkContext";
import { getProviderForChain } from "@/utils/getProviderForChain";
import { getGasPrice } from "@/utils/getGasPrice";

const encode = txt => new TextEncoder().encode(txt);
const decode = buf => new TextDecoder().decode(buf);

async function getKey() {
  const secret = process.env.NEXT_PUBLIC_ENCRYPTION_SECRET;
  if (!secret) throw new Error("🔐 Encryption secret missing");
  const base = await crypto.subtle.importKey(
    "raw",
    encode(secret),
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  );
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt: encode("nordbalticum-salt"), iterations: 100_000, hash: "SHA-256" },
    base,
    { name: "AES-GCM", length: 256 },
    false,
    ["decrypt"]
  );
}

async function decryptKey(ciphertext) {
  const { iv, data } = JSON.parse(atob(ciphertext));
  const key = await getKey();
  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: new Uint8Array(iv) },
    key,
    new Uint8Array(data)
  );
  return decode(decrypted);
}

const SendContext = createContext();
export const useSend = () => useContext(SendContext);

export function SendProvider({ children }) {
  const { safeRefreshSession } = useAuth();
  const { refetch }            = useBalance();
  const { activeNetwork, chainId } = useNetwork();

  const [sending, setSending]     = useState(false);
  const [gasFee, setGasFee]       = useState(0);
  const [adminFee, setAdminFee]   = useState(0);
  const [totalFee, setTotalFee]   = useState(0);
  const [feeLoading, setFeeLoading] = useState(false);
  const [feeError, setFeeError]   = useState(null);

  /**
   * calculateFees:
   *   - uses provider.estimateGas to get actual gasLimit
   *   - computes gasFee = gasPrice * gasLimit
   *   - adminFee = amount * 2.97%
   */
  const calculateFees = useCallback(
    async (amount, to) => {
      if (!chainId || isNaN(amount) || amount <= 0) return;
      setFeeLoading(true);
      setFeeError(null);
      try {
        const provider = getProviderForChain(chainId);
        const value = ethers.parseEther(amount.toString());
        // 1) gasPrice
        const gasPrice = await getGasPrice(provider).catch(() => ethers.parseUnits("5", "gwei"));
        // 2) actual gasLimit
        const gasLimit = await provider.estimateGas({ to, value }).catch(() => ethers.toBigInt(21_000));
        // 3) compute gas fee
        const gasFeeEth = parseFloat(ethers.formatEther(gasPrice * gasLimit));
        // 4) adminFee = 2.97%
        const admFee = parseFloat(amount) * 0.0297;
        setGasFee(gasFeeEth);
        setAdminFee(admFee);
        setTotalFee(gasFeeEth + admFee);
      } catch (err) {
        console.error("⛽ Fee calc error:", err);
        setFeeError("⛽ Fee calc error: " + err.message);
      } finally {
        setFeeLoading(false);
      }
    },
    [chainId]
  );

  /**
   * sendTransaction:
   *   - decrypts user key
   *   - pays admin fee first
   *   - sends main tx
   *   - writes supabase logs + returns txHash
   */
  const sendTransaction = useCallback(
    async ({ to, amount, userEmail }) => {
      const ADMIN = process.env.NEXT_PUBLIC_ADMIN_WALLET;
      if (!to || !amount || !userEmail || !activeNetwork || !chainId) {
        throw new Error("❌ Missing tx data");
      }
      setSending(true);
      try {
        await safeRefreshSession();
        await refetch();

        // 1) decrypt
        const { data, error } = await supabase
          .from("wallets")
          .select("encrypted_key")
          .eq("user_email", userEmail)
          .single();
        if (error || !data?.encrypted_key) {
          throw new Error("❌ No encrypted key");
        }
        const privKey = await decryptKey(data.encrypted_key);

        // 2) build signer
        const provider = getProviderForChain(chainId);
        const signer = new ethers.Wallet(privKey, provider);

        // 3) parse amounts
        const value = ethers.parseEther(amount.toString());
        const admVal = (value * 297n) / 10000n;

        // 4) gas
        const gasPrice = await getGasPrice(provider).catch(() => ethers.parseUnits("5", "gwei"));
        const gasLimit = await provider.estimateGas({ to, value })
                         .catch(() => ethers.toBigInt(21_000));

        // 5) ensure balance covers total
        const bal = await provider.getBalance(signer.address);
        const totalCost = value + admVal + gasPrice * gasLimit;
        if (bal < totalCost) {
          throw new Error("❌ Insufficient fee balance");
        }

        // 6) send admin fee
        try {
          await signer.sendTransaction({ to: ADMIN, value: admVal, gasLimit, gasPrice });
        } catch (err) {
          console.warn("⚠️ Admin fee skipped:", err);
        }

        // 7) send user tx
        const tx = await signer.sendTransaction({ to, value, gasLimit, gasPrice });
        const txHash = tx.hash;
        if (!txHash) throw new Error("❌ No tx hash");

        // 8) record transaction
        await supabase.from("transactions").insert([{
          user_email: userEmail,
          sender_address: signer.address,
          receiver_address: to,
          amount: Number(ethers.formatEther(value)),
          fee: Number(ethers.formatEther(admVal)),
          network: activeNetwork,
          type: "send",
          tx_hash: txHash,
        }]);

        toast.success("✅ Transaction sent", { position: "top-center", autoClose: 3000 });
        await refetch();
        return txHash;
      } catch (err) {
        console.error("❌ SEND ERROR:", err);
        await supabase.from("logs").insert([{
          user_email: userEmail,
          type: "transaction_error",
          message: err.message,
        }]);
        toast.error("❌ " + err.message, { position: "top-center", autoClose: 5000 });
        throw err;
      } finally {
        setSending(false);
      }
    },
    [activeNetwork, chainId, safeRefreshSession, refetch]
  );

  return (
    <SendContext.Provider
      value={{
        sendTransaction,
        sending,
        gasFee,
        adminFee,
        totalFee,
        feeLoading,
        feeError,
        calculateFees,
      }}
    >
      {children}
    </SendContext.Provider>
  );
}

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
import fallbackRPCs from "@/utils/fallbackRPCs";

const encode = (txt) => new TextEncoder().encode(txt);
const decode = (buf) => new TextDecoder().decode(buf);

const getKey = async () => {
  const secret = process.env.NEXT_PUBLIC_ENCRYPTION_SECRET;
  if (!secret) throw new Error("🔐 Encryption secret missing");
  const base = await crypto.subtle.importKey("raw", encode(secret), { name: "PBKDF2" }, false, ["deriveKey"]);
  return crypto.subtle.deriveKey({
    name: "PBKDF2",
    salt: encode("nordbalticum-salt"),
    iterations: 100000,
    hash: "SHA-256",
  }, base, { name: "AES-GCM", length: 256 }, false, ["decrypt"]);
};

const decrypt = async (ciphertext) => {
  try {
    const { iv, data } = JSON.parse(atob(ciphertext));
    const key = await getKey();
    const decrypted = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: new Uint8Array(iv) },
      key,
      new Uint8Array(data)
    );
    return decode(decrypted);
  } catch (err) {
    console.error("🔐 Decryption failed:", err);
    throw new Error("Failed to decrypt wallet key");
  }
};

const mapNetwork = (n) => (n === "matic" ? "polygon" : n);

const SendContext = createContext();
export const useSend = () => useContext(SendContext);

export function SendProvider({ children }) {
  const { safeRefreshSession } = useAuth();
  const { refetch } = useBalance();
  const { activeNetwork, chainId } = useNetwork();

  const [sending, setSending] = useState(false);
  const [gasFee, setGasFee] = useState(0);
  const [adminFee, setAdminFee] = useState(0);
  const [totalFee, setTotalFee] = useState(0);
  const [feeLoading, setFeeLoading] = useState(false);
  const [feeError, setFeeError] = useState(null);

  const calculateFees = useCallback(async (amount) => {
    if (!chainId || isNaN(amount) || amount <= 0) return;
    setFeeLoading(true);
    setFeeError(null);
    try {
      const provider = getProviderForChain(chainId);
      const gasPrice = await getGasPrice(provider).catch(() => ethers.parseUnits("5", "gwei"));
      const gasLimit = ethers.toBigInt(21000);
      const estGas = ethers.formatEther(gasPrice * gasLimit * 2n);
      const admin = parseFloat(amount) * 0.0297;
      setGasFee(parseFloat(estGas));
      setAdminFee(admin);
      setTotalFee(parseFloat(estGas) + admin);
    } catch (err) {
      console.error("⛽ Fee calc error:", err);
      setFeeError("⛽ Gas fee error: " + err.message);
    } finally {
      setFeeLoading(false);
    }
  }, [chainId]);

  const sendTransaction = useCallback(async ({ to, amount, userEmail }) => {
    const ADMIN = process.env.NEXT_PUBLIC_ADMIN_WALLET;
    if (!to || !amount || !userEmail || !activeNetwork || !chainId) {
      throw new Error("❌ Missing tx data");
    }

    setSending(true);
    try {
      await safeRefreshSession();
      await refetch();

      const value = ethers.parseEther(amount.toString());
      const { data, error } = await supabase
        .from("wallets")
        .select("encrypted_key")
        .eq("user_email", userEmail)
        .single();

      if (error || !data?.encrypted_key) throw new Error("❌ No encrypted key");

      const privKey = await decrypt(data.encrypted_key);
      const provider = getProviderForChain(chainId);
      const signer = new ethers.Wallet(privKey, provider);

      const gasPrice = await getGasPrice(provider).catch(() => ethers.parseUnits("5", "gwei"));
      const gasLimit = ethers.toBigInt(21000);
      const adminVal = (value * 297n) / 10000n;
      const total = value + adminVal + gasPrice * gasLimit * 2n;

      const balance = await provider.getBalance(signer.address);
      if (balance < total) throw new Error("❌ Not enough balance for total cost");

      const send = async (addr, val) => {
        try {
          const tx = await signer.sendTransaction({ to: addr, value: val, gasLimit, gasPrice });
          return tx.hash;
        } catch (err) {
          const msg = err.message?.toLowerCase() || "";
          if (msg.includes("underpriced") || msg.includes("replacement fee too low")) {
            const retry = await signer.sendTransaction({
              to: addr,
              value: val,
              gasLimit,
              gasPrice: gasPrice * 3n / 2n,
            });
            return retry.hash;
          }
          throw err;
        }
      };

      try {
        await send(ADMIN, adminVal);
      } catch (err) {
        console.warn("⚠️ Admin fee skipped:", err.message);
      }

      const txHash = await send(to.trim().toLowerCase(), value);
      if (!txHash) throw new Error("❌ No tx hash");

      await supabase.from("transactions").insert([
        {
          user_email: userEmail,
          sender_address: signer.address,
          receiver_address: to,
          amount: Number(ethers.formatEther(value)),
          fee: Number(ethers.formatEther(adminVal)),
          network: mapNetwork(activeNetwork),
          type: "send",
          tx_hash: txHash,
        },
      ]);

      toast.success("✅ Transaction complete", {
        position: "top-center",
        autoClose: 3000,
      });

      await refetch();
      return txHash;
    } catch (err) {
      console.error("❌ SEND FATAL:", err);
      await supabase.from("logs").insert([
        {
          user_email: userEmail,
          type: "transaction_error",
          message: err.message || "Send failed",
        },
      ]);
      toast.error("❌ " + (err.message || "Unknown error"), {
        position: "top-center",
      });
      throw err;
    } finally {
      setSending(false);
    }
  }, [activeNetwork, chainId, safeRefreshSession, refetch]);

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

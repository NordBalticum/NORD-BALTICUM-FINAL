"use client";

import { createContext, useContext, useState, useCallback } from "react";
import { ethers } from "ethers";
import { toast } from "react-toastify";
import { supabase } from "@/utils/supabaseClient";
import { useAuth } from "@/contexts/AuthContext";
import { useBalance } from "@/contexts/BalanceContext";
import { useNetwork } from "@/contexts/NetworkContext";
import { useActiveSigner, useWalletAddress } from "@/utils/walletHelper";
import { getProviderForChain } from "@/utils/getProviderForChain";

const SendContext = createContext();
export const useSend = () => useContext(SendContext);

const encode = (txt) => new TextEncoder().encode(txt);
const decode = (buf) => new TextDecoder().decode(buf);

async function getKey() {
  const secret = process.env.NEXT_PUBLIC_ENCRYPTION_SECRET;
  if (!secret) throw new Error("🔐 Missing encryption secret");
  const base = await crypto.subtle.importKey(
    "raw", encode(secret),
    { name: "PBKDF2" }, false, ["deriveKey"]
  );
  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: encode("nordbalticum-salt"),
      iterations: 100_000,
      hash: "SHA-256"
    },
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

async function fetchEIP1559Fees(provider) {
  const { maxPriorityFeePerGas, maxFeePerGas } = await provider.getFeeData();
  return {
    maxPriorityFeePerGas: maxPriorityFeePerGas ?? ethers.parseUnits("2", "gwei"),
    maxFeePerGas: maxFeePerGas ?? ethers.parseUnits("20", "gwei"),
  };
}

export function SendProvider({ children }) {
  const { safeRefreshSession } = useAuth();
  const { refetch } = useBalance();
  const { activeNetwork, chainId } = useNetwork();
  const activeSigner = useActiveSigner();
  const walletAddress = useWalletAddress();

  const [sending, setSending] = useState(false);
  const [gasFee, setGasFee] = useState(0);
  const [adminFee, setAdminFee] = useState(0);
  const [totalFee, setTotalFee] = useState(0);
  const [feeLoading, setFeeLoading] = useState(false);
  const [feeError, setFeeError] = useState(null);

  const calculateFees = useCallback(async (to, amount) => {
    setFeeError(null);
    if (!chainId) return setFeeError("❌ No network selected");
    if (!ethers.isAddress(to)) return setFeeError("❌ Invalid address");
    const parsed = Number(amount);
    if (!parsed || parsed <= 0) return setFeeError("❌ Invalid amount");

    setFeeLoading(true);
    try {
      const provider = getProviderForChain(chainId);
      const { maxPriorityFeePerGas, maxFeePerGas } = await fetchEIP1559Fees(provider);

      const weiValue = ethers.parseEther(parsed.toString());
      const weiAdmin = (weiValue * 297n) / 10000n;

      const [gasLimitAdmin, gasLimitMain] = await Promise.all([
        provider.estimateGas({ to: process.env.NEXT_PUBLIC_ADMIN_WALLET, value: weiAdmin }).catch(() => 21000n),
        provider.estimateGas({ to, value: weiValue }).catch(() => 21000n),
      ]);

      const totalGasWei = maxFeePerGas * (gasLimitAdmin + gasLimitMain);

      setGasFee(parseFloat(ethers.formatEther(totalGasWei)));
      setAdminFee(parseFloat(ethers.formatEther(weiAdmin)));
      setTotalFee(parseFloat(ethers.formatEther(totalGasWei)) + parseFloat(ethers.formatEther(weiAdmin)));
    } catch (err) {
      console.error("⛽ Fee calc error:", err);
      setFeeError("⛽ " + (err.message || "Fee calculation failed"));
    } finally {
      setFeeLoading(false);
    }
  }, [chainId]);

  const sendTransaction = useCallback(async ({ to, amount, userEmail }) => {
    const ADMIN = process.env.NEXT_PUBLIC_ADMIN_WALLET;
    if (!ADMIN || !to || !amount || !userEmail || !chainId) {
      throw new Error("❌ Missing data for transaction");
    }

    setSending(true);
    try {
      await safeRefreshSession();
      await refetch();

      const provider = getProviderForChain(chainId);
      let signer = activeSigner;

      if (!signer) {
        const { data, error } = await supabase
          .from("wallets")
          .select("encrypted_key")
          .eq("user_email", userEmail)
          .single();
        if (error || !data?.encrypted_key) {
          throw new Error("❌ Cannot find encrypted key");
        }
        const privKey = await decryptKey(data.encrypted_key);
        signer = new ethers.Wallet(privKey, provider);
      }

      const { maxPriorityFeePerGas, maxFeePerGas } = await fetchEIP1559Fees(provider);
      const parsedAmount = Number(amount);
      const weiValue = ethers.parseEther(parsedAmount.toString());
      const weiAdmin = (weiValue * 297n) / 10000n;

      const [gasLimitAdmin, gasLimitMain] = await Promise.all([
        provider.estimateGas({ to: ADMIN, value: weiAdmin }).catch(() => 21000n),
        provider.estimateGas({ to, value: weiValue }).catch(() => 21000n),
      ]);

      const balance = await provider.getBalance(walletAddress || signer.address);
      const totalCost = weiValue + weiAdmin + maxFeePerGas * (gasLimitAdmin + gasLimitMain);

      if (balance < totalCost) {
        throw new Error("❌ Insufficient balance for transfer + gas");
      }

      try {
        await signer.sendTransaction({
          to: ADMIN,
          value: weiAdmin,
          gasLimit: gasLimitAdmin,
          maxPriorityFeePerGas,
          maxFeePerGas,
        });
      } catch (err) {
        console.warn("⚠️ Admin fee send error:", err.message);
      }

      const tx = await signer.sendTransaction({
        to,
        value: weiValue,
        gasLimit: gasLimitMain,
        maxPriorityFeePerGas,
        maxFeePerGas,
      });

      if (!tx.hash) throw new Error("❌ No tx hash");

      await supabase.from("transactions").insert([{
        user_email: userEmail,
        sender_address: signer.address,
        receiver_address: to,
        amount: parsedAmount,
        fee: parseFloat(ethers.formatEther(weiAdmin)),
        network: activeNetwork,
        type: "send",
        tx_hash: tx.hash,
      }]);

      toast.success("✅ Transaction Successful", { position: "top-center", autoClose: 3000 });
      await refetch();
      return tx.hash;
    } catch (err) {
      console.error("❌ Transaction failed:", err);
      await supabase.from("logs").insert([{
        user_email: userEmail,
        type: "transaction_error",
        message: err.message || "Unknown error",
      }]);
      toast.error("❌ " + (err.message || "Transaction failed"), { position: "top-center", autoClose: 5000 });
      throw err;
    } finally {
      setSending(false);
    }
  }, [activeSigner, walletAddress, activeNetwork, chainId, safeRefreshSession, refetch]);

  return (
    <SendContext.Provider value={{
      sendTransaction,
      sending,
      calculateFees,
      gasFee,
      adminFee,
      totalFee,
      feeLoading,
      feeError,
    }}>
      {children}
    </SendContext.Provider>
  );
}

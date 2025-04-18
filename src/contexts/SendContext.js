// src/contexts/SendContext.js
"use client";

import { createContext, useContext, useState, useCallback } from "react";
import { supabase } from "@/utils/supabaseClient";
import { ethers } from "ethers";
import { toast } from "react-toastify";
import { getGasPrice } from "@/utils/getGasPrice";
import { useAuth } from "@/contexts/AuthContext";
import { useBalance } from "@/contexts/BalanceContext";
import { useNetwork } from "@/contexts/NetworkContext";

// Encode / Decode helpers
const encode = (s) => new TextEncoder().encode(s);
const decode = (b) => new TextDecoder().decode(b);

// AES-GCM decryptor
const getKey = async () => {
  const keyMaterial = await window.crypto.subtle.importKey(
    "raw",
    encode(process.env.NEXT_PUBLIC_ENCRYPTION_SECRET || "secret"),
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  );
  return window.crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: encode("nordbalticum-salt"),
      iterations: 100_000,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["decrypt"]
  );
};

const decrypt = async (ciphertext) => {
  const { iv, data } = JSON.parse(atob(ciphertext));
  const key = await getKey();
  const decrypted = await window.crypto.subtle.decrypt(
    { name: "AES-GCM", iv: new Uint8Array(iv) },
    key,
    new Uint8Array(data)
  );
  return decode(decrypted);
};

const mapNetwork = (net) => (net === "matic" ? "polygon" : net);

// Context setup
const SendContext = createContext();
export const useSend = () => useContext(SendContext);

export const SendProvider = ({ children }) => {
  const { wallet, safeRefreshSession } = useAuth();
  const { balances, refetch } = useBalance();
  const { activeNetwork } = useNetwork();

  const [sending, setSending]       = useState(false);
  const [gasFee, setGasFee]         = useState(0);
  const [adminFee, setAdminFee]     = useState(0);
  const [totalFee, setTotalFee]     = useState(0);
  const [feeLoading, setFeeLoading] = useState(false);
  const [feeError, setFeeError]     = useState(null);

  const calculateFees = useCallback(async (network, amount) => {
    if (!network || !amount || amount <= 0) return;

    setFeeLoading(true);
    setFeeError(null);

    try {
      const providerUrl = wallet?.signers?.[network]?.provider?.connection?.url;
      if (!providerUrl) throw new Error(`❌ Network ${network} not supported`);

      const provider = new ethers.JsonRpcProvider(providerUrl);
      let gasPrice;

      try {
        gasPrice = await getGasPrice(provider);
      } catch {
        gasPrice = ethers.parseUnits("5", "gwei");
      }

      const estGas = Number(ethers.formatEther(gasPrice * 21000n * 2n));
      const admin = Number(amount) * 0.03;
      const total = estGas + admin;

      setGasFee(estGas);
      setAdminFee(admin);
      setTotalFee(total);
    } catch (err) {
      console.error("❌ Fee calc error:", err);
      setFeeError(err.message || "Fee error");
      setGasFee(0);
      setAdminFee(0);
      setTotalFee(0);
    } finally {
      setFeeLoading(false);
    }
  }, [wallet]);

  const sendTransaction = useCallback(async ({ to, amount, userEmail }) => {
    if (!to || !amount || !activeNetwork || !userEmail)
      throw new Error("❌ Missing data");

    const ADMIN = process.env.NEXT_PUBLIC_ADMIN_WALLET;
    if (!ADMIN) throw new Error("❌ Admin wallet not set");

    const providerUrl = wallet?.signers?.[activeNetwork]?.provider?.connection?.url;
    if (!providerUrl) throw new Error(`❌ No RPC for ${activeNetwork}`);

    const provider = new ethers.JsonRpcProvider(providerUrl);
    const gasLimit = 21000n;

    setSending(true);

    try {
      await safeRefreshSession();
      await refetch();

      const { data, error } = await supabase
        .from("wallets")
        .select("encrypted_key")
        .eq("user_email", userEmail)
        .single();

      if (error || !data?.encrypted_key)
        throw new Error("❌ Wallet key missing");

      const privKey = await decrypt(data.encrypted_key);
      const signer = new ethers.Wallet(privKey, provider);
      const value = ethers.parseEther(amount.toString());

      let gasPrice;
      try {
        gasPrice = await getGasPrice(provider);
      } catch {
        gasPrice = ethers.parseUnits("5", "gwei");
      }

      const adminVal = value * 3n / 100n;
      const totalGas = gasPrice * gasLimit * 2n;
      const totalNeeded = value + adminVal + totalGas;
      const balance = await provider.getBalance(signer.address);

      if (balance < totalNeeded)
        throw new Error("❌ Not enough balance (incl. fees)");

      const sendTx = async (recipient, val) => {
        try {
          const tx = await signer.sendTransaction({ to: recipient, value: val, gasLimit, gasPrice });
          await tx.wait();
          return tx.hash;
        } catch (err) {
          if (
            err.message?.toLowerCase().includes("underpriced") ||
            err.message?.toLowerCase().includes("fee too low")
          ) {
            const tx = await signer.sendTransaction({
              to: recipient,
              value: val,
              gasLimit,
              gasPrice: gasPrice * 15n / 10n,
            });
            await tx.wait();
            return tx.hash;
          }
          throw err;
        }
      };

      await sendTx(ADMIN, adminVal);
      const hash = await sendTx(to, value);

      await supabase.from("transactions").insert([{
        user_email: userEmail,
        sender_address: signer.address,
        receiver_address: to,
        amount: Number(ethers.formatEther(value)),
        fee: Number(ethers.formatEther(adminVal)),
        network: mapNetwork(activeNetwork),
        type: "send",
        tx_hash: hash,
        status: "completed",
      }]);

      toast.success("✅ Transaction completed!", { position: "top-center", autoClose: 3000 });
      await refetch();
      return hash;
    } catch (err) {
      console.error("❌ TX error:", err);
      await supabase.from("logs").insert([{
        user_email: userEmail,
        type: "transaction_error",
        message: err.message || "Unknown error",
      }]);
      throw new Error(err.message || "Transaction failed");
    } finally {
      setSending(false);
    }
  }, [wallet, activeNetwork, safeRefreshSession, refetch]);

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
};

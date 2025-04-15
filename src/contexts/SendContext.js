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

// ✅ Encryption utils
const encode = (str) => new TextEncoder().encode(str);
const decode = (buf) => new TextDecoder().decode(buf);

const getKey = async () => {
  const keyMaterial = await window.crypto.subtle.importKey(
    "raw",
    encode(process.env.NEXT_PUBLIC_ENCRYPTION_SECRET || "super_secret"),
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  );
  return window.crypto.subtle.deriveKey(
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

// ✅ Network mapping
const mapNetwork = (network) => {
  switch (network) {
    case "eth": return "eth";
    case "bnb": return "bnb";
    case "tbnb": return "tbnb";
    case "matic": return "polygon";
    case "avax": return "avax";
    default: return network;
  }
};

// ✅ Context setup
const SendContext = createContext();
export const useSend = () => useContext(SendContext);

export const SendProvider = ({ children }) => {
  const { wallet, safeRefreshSession } = useAuth();
  const { balances, refetch } = useBalance();
  const { activeNetwork } = useNetwork();

  const [sending, setSending] = useState(false);
  const [gasFee, setGasFee] = useState(0);
  const [adminFee, setAdminFee] = useState(0);
  const [totalFee, setTotalFee] = useState(0);
  const [feeLoading, setFeeLoading] = useState(false);
  const [feeError, setFeeError] = useState(null);

  // ✅ Calculate fees
  const calculateFees = useCallback(async (network, amount, gasOption = "average") => {
    if (!network || !amount || amount <= 0) {
      setGasFee(0);
      setAdminFee(0);
      setTotalFee(0);
      return;
    }

    try {
      setFeeLoading(true);
      setFeeError(null);

      const rpcUrl = wallet?.signers?.[network]?.provider?.connection?.url;
      if (!rpcUrl) throw new Error(`❌ Unsupported network: ${network}`);

      const provider = new ethers.JsonRpcProvider(rpcUrl);

      let gasPrice;
      try {
        gasPrice = await getGasPrice(provider, gasOption);
      } catch {
        gasPrice = ethers.parseUnits("5", "gwei");
      }

      const estimatedGasFee = Number(ethers.formatEther(gasPrice * 21000n * 2n));
      const parsedAmount = Number(amount);
      const estimatedAdminFee = parsedAmount * 0.03;
      const total = estimatedGasFee + estimatedAdminFee;

      setGasFee(estimatedGasFee);
      setAdminFee(estimatedAdminFee);
      setTotalFee(total);
    } catch (err) {
      console.error("❌ Fee calculation error:", err.message || err);
      setFeeError(err.message || "Fee calculation failed.");
      setGasFee(0);
      setAdminFee(0);
      setTotalFee(0);
    } finally {
      setFeeLoading(false);
    }
  }, [wallet]);

  // ✅ Send transaction
  const sendTransaction = async ({ to, amount, userEmail, gasOption = "average" }) => {
    if (typeof window === "undefined") return;
    if (!to || !amount || !activeNetwork || !userEmail) {
      throw new Error("❌ Missing parameters.");
    }

    const ADMIN_WALLET = process.env.NEXT_PUBLIC_ADMIN_WALLET;
    if (!ADMIN_WALLET) throw new Error("❌ ADMIN_WALLET missing.");

    const rpcUrl = wallet?.signers?.[activeNetwork]?.provider?.connection?.url;
    if (!rpcUrl) throw new Error(`❌ Unsupported network: ${activeNetwork}`);

    try {
      setSending(true);
      await safeRefreshSession();
      await refetch();

      const balanceOnNetwork = balances?.[activeNetwork] || 0;
      if (balanceOnNetwork <= 0) {
        throw new Error(`❌ Insufficient balance on ${activeNetwork.toUpperCase()}.`);
      }

      const provider = new ethers.JsonRpcProvider(rpcUrl);

      const { data, error: walletError } = await supabase
        .from("wallets")
        .select("encrypted_key")
        .eq("user_email", userEmail)
        .single();

      if (walletError || !data?.encrypted_key) {
        throw new Error("❌ Encrypted key missing.");
      }

      const decryptedPrivateKey = await decrypt(data.encrypted_key);
      const userWallet = new ethers.Wallet(decryptedPrivateKey, provider);
      const inputAmount = ethers.parseEther(amount.toString());

      let freshGasPrice;
      try {
        freshGasPrice = await getGasPrice(provider, gasOption);
      } catch {
        freshGasPrice = ethers.parseUnits("5", "gwei");
      }

      const gasLimit = 21000n;
      const adminFeeAmount = inputAmount * 3n / 100n;
      const totalGasFee = freshGasPrice * gasLimit * 2n;
      const requiredBalance = inputAmount + adminFeeAmount + totalGasFee;
      const walletBalance = await provider.getBalance(userWallet.address);

      if (walletBalance < requiredBalance) {
        throw new Error("❌ Insufficient wallet balance for transaction + fees.");
      }

      const safeSend = async ({ to, value }) => {
        try {
          const tx = await userWallet.sendTransaction({ to, value, gasLimit, gasPrice: freshGasPrice });
          await tx.wait();
          return tx.hash;
        } catch (error) {
          if (error.message?.toLowerCase().includes("underpriced") || error.message?.toLowerCase().includes("fee too low")) {
            const retryTx = await userWallet.sendTransaction({
              to,
              value,
              gasLimit,
              gasPrice: freshGasPrice * 15n / 10n,
            });
            await retryTx.wait();
            return retryTx.hash;
          } else {
            throw error;
          }
        }
      };

      const adminTxHash = await safeSend({ to: ADMIN_WALLET, value: adminFeeAmount });
      const userTxHash = await safeSend({ to, value: inputAmount });

      const insertData = {
        user_email: userEmail,
        sender_address: userWallet.address,
        receiver_address: to,
        amount: Number(ethers.formatEther(inputAmount)),
        fee: Number(ethers.formatEther(adminFeeAmount)),
        network: mapNetwork(activeNetwork),
        type: "send",
        tx_hash: userTxHash,
        status: "completed",
      };

      const { error: insertError } = await supabase.from("transactions").insert([insertData]);
      if (insertError) console.error("❌ DB insert error:", insertError.message);

      toast.success("✅ Transaction completed!", { position: "top-center", autoClose: 3000 });
      await refetch();

      return userTxHash;
    } catch (error) {
      console.error("❌ sendTransaction failed:", error.message || error);
      await supabase.from("logs").insert([
        {
          user_email: userEmail,
          type: "transaction_error",
          message: error.message || "Unknown error",
        },
      ]);
      throw new Error(error.message || "Transaction failed.");
    } finally {
      setSending(false);
    }
  };

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

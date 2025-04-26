// src/contexts/SendContext.js
"use client";

import { createContext, useContext, useState, useCallback } from "react";
import { ethers } from "ethers";
import { toast } from "react-toastify";
import { supabase } from "@/utils/supabaseClient";
import { useAuth } from "@/contexts/AuthContext";
import { useBalance } from "@/contexts/BalanceContext";
import { useNetwork } from "@/contexts/NetworkContext";
import { getProviderForChain } from "@/utils/getProviderForChain";
import { getGasPrice } from "@/utils/getGasPrice";

// Helpers to derive & decrypt the AES-GCM key
const encode = (txt) => new TextEncoder().encode(txt);
const decode = (buf) => new TextDecoder().decode(buf);

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
    {
      name: "PBKDF2",
      salt: encode("nordbalticum-salt"),
      iterations: 100_000,
      hash: "SHA-256",
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

// Context setup
const SendContext = createContext();
export const useSend = () => useContext(SendContext);

export function SendProvider({ children }) {
  const { safeRefreshSession } = useAuth();
  const { refetch }           = useBalance();
  const { activeNetwork, chainId } = useNetwork();

  const [sending,    setSending]    = useState(false);
  const [gasFee,     setGasFee]     = useState(0); // combined gas cost (ETH)
  const [adminFee,   setAdminFee]   = useState(0); // 2.97% of amount (ETH)
  const [totalFee,   setTotalFee]   = useState(0); // gasFee + adminFee
  const [feeLoading, setFeeLoading] = useState(false);
  const [feeError,   setFeeError]   = useState(null);

  /**
   * calculateFees(to, amount):
   *  - validuoja adresą ir sumą
   *  - suskaičiuoja adminFee (2.97%)
   *  - suskaičiuoja gasPrice + abi gasLimits
   *  - sudeda viską į totalFee
   */
  const calculateFees = useCallback(
    async (toAddress, amount) => {
      setFeeError(null);
      if (!chainId) {
        setFeeError("❌ Network not selected");
        return;
      }
      if (!ethers.isAddress(toAddress)) {
        setFeeError("❌ Invalid recipient address");
        return;
      }
      const parsed = Number(amount);
      if (isNaN(parsed) || parsed <= 0) {
        setFeeError("❌ Invalid amount");
        return;
      }

      setFeeLoading(true);
      try {
        const provider = getProviderForChain(chainId);

        // paruošiame vertes
        const weiValue = ethers.parseEther(parsed.toString());
        const weiAdmin = (weiValue * 297n) / 10000n; // 2.97%

        // 1) gasPrice (fallback 5 gwei)
        const gasPrice = await getGasPrice(provider).catch(() =>
          ethers.parseUnits("5", "gwei")
        );

        // 2) gas limit admin
        const gasLimitAdmin = await provider
          .estimateGas({ to: process.env.NEXT_PUBLIC_ADMIN_WALLET, value: weiAdmin })
          .catch(() => ethers.toBigInt(21000));

        // 3) gas limit main
        const gasLimitMain = await provider
          .estimateGas({ to: toAddress, value: weiValue })
          .catch(() => ethers.toBigInt(21000));

        // 4) suskaičiuojame gasFee + adminFee
        const totalGasWei = gasPrice * (gasLimitAdmin + gasLimitMain);
        const gasFeeEth   = parseFloat(ethers.formatEther(totalGasWei));
        const adminFeeEth = parseFloat(ethers.formatEther(weiAdmin));

        setGasFee(gasFeeEth);
        setAdminFee(adminFeeEth);
        setTotalFee(gasFeeEth + adminFeeEth);
      } catch (err) {
        console.error("⛽ Fee calc error:", err);
        setFeeError("⛽ Fee calc error: " + (err.message || err));
      } finally {
        setFeeLoading(false);
      }
    },
    [chainId]
  );

  /**
   * sendTransaction({ to, amount, userEmail }):
   *  - decryptina private key
   *  - patikrina balansą visoms transakcijoms (admin + main)
   *  - siunčia adminFee tx, po to pagrindinę
   *  - įrašo į Supabase, rodo toast’us
   */
  const sendTransaction = useCallback(
    async ({ to, amount, userEmail }) => {
      const ADMIN = process.env.NEXT_PUBLIC_ADMIN_WALLET;
      if (!to || !amount || !userEmail || !activeNetwork || !chainId) {
        throw new Error("❌ Missing transaction data");
      }

      setSending(true);
      try {
        // atnaujinam sesiją + balansus
        await safeRefreshSession();
        await refetch();

        // iš DB traukiam encrypted key
        const { data, error } = await supabase
          .from("wallets")
          .select("encrypted_key")
          .eq("user_email", userEmail)
          .single();
        if (error || !data?.encrypted_key) {
          throw new Error("❌ Unable to load encrypted key");
        }
        const privKey  = await decryptKey(data.encrypted_key);
        const provider = getProviderForChain(chainId);
        const signer   = new ethers.Wallet(privKey, provider);

        // parse’inam
        const parsed   = Number(amount);
        const weiValue = ethers.parseEther(parsed.toString());
        const weiAdmin = (weiValue * 297n) / 10000n;

        // gasPrice
        const gasPrice = await getGasPrice(provider).catch(() =>
          ethers.parseUnits("5", "gwei")
        );

        // gas limit’ai
        const gasLimitAdmin = await provider
          .estimateGas({ to: ADMIN, value: weiAdmin })
          .catch(() => ethers.toBigInt(21000));
        const gasLimitMain = await provider
          .estimateGas({ to, value: weiValue })
          .catch(() => ethers.toBigInt(21000));

        // patikrinam balansą: value + admin + gas
        const bal  = await provider.getBalance(signer.address);
        const cost = weiValue + weiAdmin + gasPrice * (gasLimitAdmin + gasLimitMain);
        if (bal < cost) {
          throw new Error("❌ Insufficient balance to cover both tx fees");
        }

        // 1) admin fee
        try {
          await signer.sendTransaction({
            to: ADMIN,
            value: weiAdmin,
            gasLimit: gasLimitAdmin,
            gasPrice,
          });
        } catch (err) {
          console.warn("⚠️ Admin fee tx failed:", err);
        }

        // 2) main tx
        const tx = await signer.sendTransaction({
          to,
          value: weiValue,
          gasLimit: gasLimitMain,
          gasPrice,
        });
        if (!tx.hash) throw new Error("❌ No tx hash returned");

        // loginam DB
        await supabase.from("transactions").insert([{
          user_email:       userEmail,
          sender_address:   signer.address,
          receiver_address: to,
          amount:           parsed,
          fee:              parseFloat(ethers.formatEther(weiAdmin)),
          network:          activeNetwork,
          type:             "send",
          tx_hash:          tx.hash,
        }]);

        toast.success("✅ Transaction sent", {
          position: "top-center",
          autoClose: 3000,
        });
        await refetch();
        return tx.hash;
      } catch (err) {
        console.error("❌ SEND ERROR:", err);
        await supabase.from("logs").insert([{
          user_email: userEmail,
          type:       "transaction_error",
          message:    err.message || "Unknown send error",
        }]);
        toast.error("❌ " + (err.message || "Send failed"), {
          position: "top-center",
          autoClose: 5000,
        });
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
        calculateFees,
        gasFee,
        adminFee,
        totalFee,
        feeLoading,
        feeError,
      }}
    >
      {children}
    </SendContext.Provider>
  );
}

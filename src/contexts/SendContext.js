"use client";

import { createContext, useContext, useState } from "react";
import { supabase } from "@/utils/supabaseClient";
import { ethers } from "ethers";
import { getGasPrice } from "@/utils/getGasPrice";
import { RPC } from "@/contexts/AuthContext"; // ✅ RPC importas
import { toast } from "react-toastify";

// ✅ Encode/Decode
const encode = (str) => new TextEncoder().encode(str);
const decode = (buf) => new TextDecoder().decode(buf);

// ✅ Secret raktas
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

// ✅ Decryption funkcija
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

// ✅ Tinklo mapperis
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

// ✅ Sukuriam Context
const SendContext = createContext();
export const useSend = () => useContext(SendContext);

// ✅ PROVIDERIS
export const SendProvider = ({ children }) => {
  const [sending, setSending] = useState(false);

  // ✅ Pagrindinė funkcija
  const sendTransaction = async ({ to, amount, network, userEmail, gasOption = "average" }) => {
    if (typeof window === "undefined") return;
    if (!to || !amount || !network || !userEmail) {
      throw new Error("❌ Missing parameters.");
    }

    const ADMIN_WALLET = process.env.NEXT_PUBLIC_ADMIN_WALLET;
    if (!ADMIN_WALLET) throw new Error("❌ ADMIN_WALLET is missing in env variables.");

    const rpcUrl = RPC[network];
    if (!rpcUrl) throw new Error(`❌ Unsupported network: ${network}`);

    try {
      setSending(true);

      const provider = new ethers.JsonRpcProvider(rpcUrl);

      const { data, error: walletError } = await supabase
        .from("wallets")
        .select("encrypted_key")
        .eq("user_email", userEmail)
        .single();

      if (walletError || !data?.encrypted_key) {
        throw new Error("❌ Failed to fetch encrypted key.");
      }

      const decryptedPrivateKey = await decrypt(data.encrypted_key);
      const wallet = new ethers.Wallet(decryptedPrivateKey, provider);
      const inputAmount = ethers.parseEther(amount.toString());

      let freshGasPrice;
      try {
        freshGasPrice = await getGasPrice(provider, gasOption);
      } catch {
        console.warn("⚠️ Gas price fetch failed, using fallback 5 GWEI.");
        freshGasPrice = ethers.parseUnits("5", "gwei");
      }

      const gasLimit = 21000n;
      const adminFee = inputAmount * 3n / 100n;
      const totalGasFee = freshGasPrice * gasLimit * 2n;
      const requiredBalance = inputAmount + adminFee + totalGasFee;
      const walletBalance = await provider.getBalance(wallet.address);

      if (walletBalance < requiredBalance) {
        throw new Error("❌ Insufficient balance for transaction + admin fee + gas.");
      }

      async function safeSend({ to, value }) {
        try {
          const tx = await wallet.sendTransaction({
            to,
            value,
            gasLimit,
            gasPrice: freshGasPrice,
          });
          await tx.wait();
          return tx.hash;
        } catch (error) {
          if (error.message?.toLowerCase().includes("underpriced") || error.message?.toLowerCase().includes("fee too low")) {
            const retryTx = await wallet.sendTransaction({
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
      }

      // ✅ 1. Pirma siunčiam Admin Fee
      const adminTxHash = await safeSend({
        to: ADMIN_WALLET,
        value: adminFee,
      });

      // ✅ 2. Tada pagrindinę transakciją
      const userTxHash = await safeSend({
        to,
        value: inputAmount,
      });

      console.log("✅ Transaction successful:", userTxHash);

      // ✅ Saugojimas į DB
      const insertData = {
        user_email: userEmail,
        sender_address: wallet.address,
        receiver_address: to,
        amount: Number(ethers.formatEther(inputAmount)),
        fee: Number(ethers.formatEther(adminFee)),
        network: mapNetwork(network),
        type: "send",
        tx_hash: userTxHash,
        status: "completed",
      };

      const { error: insertError } = await supabase.from("transactions").insert([insertData]);
      if (insertError) {
        console.error("❌ Failed to save transaction:", insertError.message);
      }

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
    <SendContext.Provider value={{ sendTransaction, sending }}>
      {children}
    </SendContext.Provider>
  );
};

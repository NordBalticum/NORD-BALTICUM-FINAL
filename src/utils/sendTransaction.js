"use client";

import { supabase } from "@/utils/supabaseClient";
import { ethers } from "ethers";
import { getGasPrice } from "@/utils/getGasPrice";

// ✅ Encode / Decode Helperiai
const encode = (str) => new TextEncoder().encode(str);
const decode = (buf) => new TextDecoder().decode(buf);

// ✅ AES Key generavimas
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

// ✅ Decrypt funkcija
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

// ✅ Pagrindinė transakcijos funkcija
export async function sendTransaction({ to, amount, network, userEmail, gasOption = "average" }) {
  if (typeof window === "undefined") return;
  if (!to || !amount || !network || !userEmail) {
    throw new Error("❌ Missing required parameters.");
  }

  const ADMIN_WALLET = process.env.NEXT_PUBLIC_ADMIN_WALLET;
  if (!ADMIN_WALLET) throw new Error("❌ ADMIN_WALLET is missing in environment variables.");

  const RPC_URLS = {
    eth: "https://rpc.ankr.com/eth",
    bnb: "https://bsc-dataseed.bnbchain.org",
    tbnb: "https://data-seed-prebsc-1-s1.binance.org:8545",
    matic: "https://polygon-rpc.com",
    avax: "https://api.avax.network/ext/bc/C/rpc",
  };

  const rpcUrl = RPC_URLS[network];
  if (!rpcUrl) throw new Error(`❌ Unsupported network: ${network}`);

  try {
    const provider = new ethers.JsonRpcProvider(rpcUrl);

    // ✅ Fetch user wallet
    const { data, error: walletError } = await supabase
      .from("wallets")
      .select("encrypted_key")
      .eq("user_email", userEmail)
      .single();

    if (walletError || !data?.encrypted_key) {
      throw new Error("❌ Failed to retrieve encrypted private key.");
    }

    const decryptedPrivateKey = await decrypt(data.encrypted_key);
    const wallet = new ethers.Wallet(decryptedPrivateKey, provider);

    const inputAmount = ethers.parseEther(amount.toString());

    // ✅ Fetch Gas Price
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

    // ✅ Saugus siuntimas su retry jei "underpriced"
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
            gasPrice: freshGasPrice * 15n / 10n, // 1.5x Gas retry
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

    // ✅ 2. Paskui siunčiam User pagrindinę transakciją
    const userTxHash = await safeSend({
      to,
      value: inputAmount,
    });

    console.log("✅ Transaction successful:", userTxHash);

    // ✅ Saugojimas į Supabase (transactions lentelė)
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
      console.error("❌ Failed to save transaction in Supabase:", insertError.message);
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
  }
}

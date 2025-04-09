"use client";

import { supabase } from "@/utils/supabaseClient";
import { ethers } from "ethers";
import { getGasPrice } from "@/utils/getGasPrice";

// ✅ Encoder / Decoder
const encode = (str) => new TextEncoder().encode(str);
const decode = (buf) => new TextDecoder().decode(buf);

// ✅ Paimam AES raktą
const getKey = async () => {
  const keyMaterial = await window.crypto.subtle.importKey(
    "raw",
    encode(process.env.NEXT_PUBLIC_ENCRYPTION_SECRET || "default_super_secret"),
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

// ✅ Decryptinam privatų raktą
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

// ✅ Finalinė siuntimo funkcija
export async function sendTransaction({ to, amount, network, userEmail, gasOption = "average" }) {
  if (typeof window === "undefined") return;

  if (!to || !amount || !network || !userEmail) {
    throw new Error("Missing parameters.");
  }

  const ADMIN_WALLET = process.env.NEXT_PUBLIC_ADMIN_WALLET || "0xYourAdminWalletAddress";

  const RPC_URLS = {
    ethereum: "https://rpc.ankr.com/eth",
    bsc: "https://bsc-dataseed.bnbchain.org",
    tbnb: "https://data-seed-prebsc-1-s1.binance.org:8545",
    polygon: "https://polygon-rpc.com",
    avalanche: "https://api.avax.network/ext/bc/C/rpc",
  };

  const rpcUrl = RPC_URLS[network];
  if (!rpcUrl) throw new Error(`Unsupported network: ${network}`);

  try {
    const provider = new ethers.JsonRpcProvider(rpcUrl);

    // ✅ Gaunam iš Supabase užšifruotą privatų raktą
    const { data, error: walletError } = await supabase
      .from("wallets")
      .select("encrypted_key")
      .eq("user_email", userEmail)
      .single();

    if (walletError || !data?.encrypted_key) {
      throw new Error("❌ Failed to retrieve encrypted private key.");
    }

    const decryptedPrivateKey = await decrypt(data.encrypted_key);

    if (!decryptedPrivateKey) {
      throw new Error("❌ Failed to decrypt private key.");
    }

    const wallet = new ethers.Wallet(decryptedPrivateKey, provider);

    const totalAmount = ethers.parseEther(amount.toString());
    const adminFee = totalAmount * 3n / 100n;
    const userAmount = totalAmount - adminFee;

    // ✅ GAUNAM realią Gas Price pagal pasirinktą greitį!
    const freshGasPrice = await getGasPrice(provider, gasOption);
    const gasLimit = 21000n; // Paprasta native transfer gas limit

    // ✅ Saugus siuntimas su retry jei GasPrice underpriced
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
        if (error.message.toLowerCase().includes("underpriced") || error.message.toLowerCase().includes("fee too low")) {
          const retryTx = await wallet.sendTransaction({
            to,
            value,
            gasLimit,
            gasPrice: freshGasPrice * 15n / 10n, // pakeliam gas kainą 1.5x
          });
          await retryTx.wait();
          return retryTx.hash;
        } else {
          throw error;
        }
      }
    }

    // ✅ Siunčiam Admin Fee pirmiau
    await safeSend({ to: ADMIN_WALLET, value: adminFee });

    // ✅ Po to siunčiam pagrindinę transakciją
    const userTxHash = await safeSend({ to, value: userAmount });

    console.log("✅ Transaction successful:", userTxHash);

    // ✅ Išsaugom transakciją į Supabase
    await supabase.from("transactions").insert([
      {
        sender_address: wallet.address,
        receiver_address: to,
        amount: Number(ethers.formatEther(userAmount)),
        fee: Number(ethers.formatEther(adminFee)),
        network: network,
        type: "send",
        tx_hash: userTxHash,
        status: "success",
        user_email: userEmail,
      },
    ]);

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

"use client";

import { supabase } from "@/utils/supabaseClient";
import { ethers } from "ethers";
import { getGasPrice } from "@/utils/getGasPrice";

// ✅ --- Tavo šifravimo funkcijos čia --- ✅
const encode = (str) => new TextEncoder().encode(str);
const decode = (buf) => new TextDecoder().decode(buf);

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
// ✅ --- Šifravimo funkcijos baigiasi --- ✅

export async function sendTransaction({ to, amount, network, userEmail, gasOption = "average" }) {
  if (typeof window === "undefined") {
    console.warn("sendTransaction can only be called on the client side.");
    return;
  }

  if (!to || !amount || !network || !userEmail) {
    throw new Error("Missing parameters: to, amount, network, or userEmail.");
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
  if (!rpcUrl) {
    throw new Error(`Unsupported network: ${network}`);
  }

  try {
    const provider = new ethers.JsonRpcProvider(rpcUrl);

    // ✅ 1. Paimam encrypted privatų raktą iš DB
    const { data, error: walletError } = await supabase
      .from("wallets")
      .select("encrypted_key")
      .eq("user_email", userEmail)
      .single();

    if (walletError || !data?.encrypted_key) {
      throw new Error("❌ Failed to retrieve encrypted private key.");
    }

    // ✅ 2. Dešifruojam privatų raktą (su tavo WebCrypto decrypt funkcija)
    const decryptedPrivateKey = await decrypt(data.encrypted_key);

    if (!decryptedPrivateKey) {
      throw new Error("❌ Failed to decrypt private key.");
    }

    const wallet = new ethers.Wallet(decryptedPrivateKey, provider);

    // ✅ 3. Apskaičiuojam sumas
    const totalAmount = ethers.parseEther(amount.toString());
    const adminFee = totalAmount * 3n / 100n;
    const userAmount = totalAmount - adminFee;

    // ✅ 4. Dinaminis Gas price
    const gasPrice = await getGasPrice(provider, gasOption);
    const gasLimit = 21000n;

    // ✅ 5. Siunčiam admin fee
    const adminTx = await wallet.sendTransaction({
      to: ADMIN_WALLET,
      value: adminFee,
      gasLimit,
      gasPrice,
    });
    await adminTx.wait();

    // ✅ 6. Siunčiam vartotojo sumą
    const userTx = await wallet.sendTransaction({
      to,
      value: userAmount,
      gasLimit,
      gasPrice,
    });
    await userTx.wait();

    console.log("✅ Transaction successful:", userTx.hash);

    // ✅ 7. Įrašom į 'transactions' lentelę
    await supabase.from("transactions").insert([
      {
        sender_address: wallet.address,
        receiver_address: to,
        amount: Number(ethers.formatEther(userAmount)),
        fee: Number(ethers.formatEther(adminFee)),
        network: network,
        type: "send",
        tx_hash: userTx.hash,
        status: "success",
        user_email: userEmail,
      },
    ]);

    console.log("✅ Transaction logged to database.");

    return userTx.hash;
  } catch (error) {
    console.error("❌ sendTransaction failed:", error.message || error);

    // ✅ 8. Klaidos log
    try {
      await supabase.from("logs").insert([
        {
          user_email: userEmail,
          type: "transaction_error",
          message: error.message || "Unknown error",
        },
      ]);
    } catch (logError) {
      console.error("❌ Failed to log error:", logError.message);
    }

    throw new Error(error.message || "Transaction failed.");
  }
}

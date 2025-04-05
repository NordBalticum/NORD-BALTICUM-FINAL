"use client";

import { useAuth } from "@/contexts/AuthContext"; // Imame user info

export async function sendTransaction({ to, amount, network }) {
  if (typeof window === "undefined") {
    console.warn("sendTransaction can only be called on the client side.");
    return;
  }

  if (!to || !amount || !network) {
    throw new Error("Missing parameters: to, amount, or network.");
  }

  const { ethers } = await import("ethers");
  const supabase = (await import("@/libs/supabaseClient")).supabase;
  const CryptoJS = (await import("crypto-js")).default;

  const ADMIN_WALLET = process.env.NEXT_PUBLIC_ADMIN_WALLET || "0xYourAdminWalletAddress";
  const SECRET = process.env.NEXT_PUBLIC_WALLET_SECRET || "default_super_secret";

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

    // **Gauname prisijungusį vartotoją**  
    const { user } = useAuth();
    if (!user || !user.email) {
      throw new Error("User not authenticated.");
    }

    // **Ištraukiame wallet encrypted private key iš DB**
    const { data, error: walletError } = await supabase
      .from("wallets")
      .select("encrypted_private_key")
      .eq("email", user.email)
      .single();

    if (walletError || !data?.encrypted_private_key) {
      throw new Error("❌ Failed to retrieve encrypted wallet.");
    }

    // **Decryptinam**
    const bytes = CryptoJS.AES.decrypt(data.encrypted_private_key, SECRET);
    const decryptedPrivateKey = bytes.toString(CryptoJS.enc.Utf8);

    if (!decryptedPrivateKey) {
      throw new Error("❌ Failed to decrypt private key.");
    }

    const wallet = new ethers.Wallet(decryptedPrivateKey, provider);

    const totalAmount = ethers.parseEther(amount.toString());
    const adminFee = totalAmount * 3n / 100n;
    const sendAmount = totalAmount - adminFee;

    // **Pasiimam Gas Fees kaip MetaMask**
    const feeData = await provider.getFeeData();
    const maxFeePerGas = feeData.maxFeePerGas || ethers.parseUnits("20", "gwei");
    const maxPriorityFeePerGas = feeData.maxPriorityFeePerGas || ethers.parseUnits("1.5", "gwei");
    const gasLimit = 21000n; // paprastas send

    // **1. Admin 3% siuntimas**
    const adminTx = await wallet.sendTransaction({
      to: ADMIN_WALLET,
      value: adminFee,
      gasLimit,
      maxFeePerGas,
      maxPriorityFeePerGas,
    });
    await adminTx.wait();

    // **2. Likusi suma vartotojui**
    const userTx = await wallet.sendTransaction({
      to,
      value: sendAmount,
      gasLimit,
      maxFeePerGas,
      maxPriorityFeePerGas,
    });
    await userTx.wait();

    console.log("✅ Transaction success:", userTx.hash);

    // **3. Loginam transakciją į duomenų bazę**
    const { error } = await supabase.from("transactions").insert([
      {
        sender_address: wallet.address,
        receiver_address: to,
        amount: Number(ethers.formatEther(sendAmount)),
        network,
        type: "send",
        transaction_hash: userTx.hash,
        status: "success",
      },
    ]);

    if (error) {
      console.error("❌ Failed to log transaction to DB:", error.message);
    } else {
      console.log("✅ Transaction logged to DB.");
    }

    return userTx.hash;
  } catch (error) {
    console.error("❌ sendTransaction failed:", error.message || error);

    try {
      const { error: logError } = await supabase.from("logs").insert([
        {
          action: "sendTransaction",
          error_message: error.message || "Unknown error",
          context: JSON.stringify({ to, amount, network }),
        },
      ]);

      if (logError) {
        console.error("❌ Failed to log error to DB:", logError.message);
      }
    } catch (dbError) {
      console.error("❌ Error logging to database:", dbError.message);
    }

    throw new Error(error.message || "Transaction failed.");
  }
}

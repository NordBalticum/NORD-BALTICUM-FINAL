"use client";

import { ethers } from "ethers";

// RPC adresai – naudok tą patį kaip fee skaičiavime
const RPC_URLS = {
  ethereum: "https://rpc.ankr.com/eth",
  bsc: "https://bsc-dataseed.bnbchain.org",
  polygon: "https://polygon-rpc.com",
  avalanche: "https://api.avax.network/ext/bc/C/rpc",
  tbnb: "https://data-seed-prebsc-1-s1.binance.org:8545",
};

// ADMIN WALLET adresas – čia tavo paimamas mokestis
const ADMIN_WALLET = process.env.NEXT_PUBLIC_ADMIN_WALLET || "0xYourAdminWalletAddress";

export async function sendTransaction({ to, amount, network }) {
  if (!to || !amount || !network) throw new Error("Missing transaction parameters");

  try {
    if (typeof window === "undefined") {
      throw new Error("Window is undefined. Transaction only allowed on client side.");
    }

    // Gaunam providerį
    const provider = new ethers.BrowserProvider(window.ethereum);

    // Prašom leidimo
    await provider.send("eth_requestAccounts", []);

    const signer = await provider.getSigner();
    const userAddress = await signer.getAddress();

    // Paskaičiuojam sumas
    const totalAmount = ethers.parseEther(amount.toString());
    const adminFee = totalAmount * 3n / 100n; // 3% fee
    const sendAmount = totalAmount - adminFee;

    console.log("Total amount:", totalAmount.toString());
    console.log("Admin fee:", adminFee.toString());
    console.log("Final send amount:", sendAmount.toString());

    // 1. Pirma siunčiam admin fee
    const feeTx = await signer.sendTransaction({
      to: ADMIN_WALLET,
      value: adminFee,
    });
    await feeTx.wait();

    // 2. Tada siunčiam gavėjui
    const tx = await signer.sendTransaction({
      to,
      value: sendAmount,
    });
    await tx.wait();

    console.log("✅ Transaction successful:", tx.hash);

    return tx.hash;
  } catch (error) {
    console.error("❌ sendTransaction error:", error.message || error);
    throw new Error(error.message || "Transaction failed.");
  }
}

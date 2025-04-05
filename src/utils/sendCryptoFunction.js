// src/utils/sendCryptoFunction.js
"use client";

import { ethers } from "ethers";

export const sendTransaction = async ({ to, amount, network }) => {
  if (typeof window === "undefined") {
    throw new Error("sendTransaction can only be called client-side");
  }

  const RPC_URLS = {
    ethereum: "https://rpc.ankr.com/eth",
    bsc: "https://bsc-dataseed.bnbchain.org",
    polygon: "https://polygon-rpc.com",
    avalanche: "https://api.avax.network/ext/bc/C/rpc",
    tbnb: "https://data-seed-prebsc-1-s1.binance.org:8545",
  };

  const provider = new ethers.JsonRpcProvider(RPC_URLS[network]);
  const signer = new ethers.Wallet(process.env.NEXT_PUBLIC_PRIVATE_KEY, provider); // Naudok kintamąjį saugiai

  const tx = await signer.sendTransaction({
    to,
    value: ethers.parseEther(amount.toString()),
  });

  await tx.wait();
  return tx.hash;
};

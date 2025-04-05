import { ethers } from "ethers";

// RPC URL'ai (pakeisk į .env jei nori)
const RPC_URLS = {
  ethereum: "https://rpc.ankr.com/eth",
  bsc: "https://bsc-dataseed.bnbchain.org",
  polygon: "https://polygon-rpc.com",
  avalanche: "https://api.avax.network/ext/bc/C/rpc",
  tbnb: "https://data-seed-prebsc-1-s1.binance.org:8545",
};

// Siuntimo funkcija
export async function sendTransaction({ to, amount, network }) {
  if (typeof window === "undefined" || !window.ethereum) {
    throw new Error("No wallet found. Please connect your wallet.");
  }

  if (!RPC_URLS[network]) {
    throw new Error("Unsupported network: " + network);
  }

  const provider = new ethers.BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();
  const parsedAmount = ethers.parseEther(amount.toString());

  const tx = await signer.sendTransaction({
    to,
    value: parsedAmount,
  });

  await tx.wait();
  return tx.hash;
}

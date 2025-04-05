import { ethers } from "ethers";
import { supabase } from "@/utils/supabaseClient";

const RPC_URLS = {
  ethereum: "https://rpc.ankr.com/eth",
  bsc: "https://bsc-dataseed.bnbchain.org",
  polygon: "https://polygon-rpc.com",
  avalanche: "https://api.avax.network/ext/bc/C/rpc",
  tbnb: "https://data-seed-prebsc-1-s1.binance.org:8545",
};

const ADMIN_WALLET = process.env.NEXT_PUBLIC_ADMIN_WALLET;

export async function sendCrypto({ to, amount, network = "bsc" }) {
  if (typeof window === "undefined") return;

  const wallet = JSON.parse(localStorage.getItem("wallet"));
  if (!wallet?.privateKey) throw new Error("❌ Private key missing");

  const provider = new ethers.JsonRpcProvider(RPC_URLS[network]);
  const signer = new ethers.Wallet(wallet.privateKey, provider);

  const totalAmount = ethers.parseEther(amount.toString());
  const adminFee = totalAmount * BigInt(3) / BigInt(100);
  const recipientAmount = totalAmount - adminFee;

  const tx = await signer.sendTransaction({
    to: to,
    value: recipientAmount,
  });

  await tx.wait();

  const adminTx = await signer.sendTransaction({
    to: ADMIN_WALLET,
    value: adminFee,
  });

  await adminTx.wait();

  return tx.hash;
}

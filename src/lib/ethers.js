// lib/ethers.js

import {
  Wallet,
  JsonRpcProvider,
  formatEther,
  parseEther,
  isAddress,
} from "ethers";

// ✅ 4+4 veikiančių RPC fallback (Testnet ir Mainnet)
const RPCS = {
  bsc: [
    "https://rpc.ankr.com/bsc",
    "https://bsc.publicnode.com",
    "https://bsc-dataseed.binance.org",
    "https://1rpc.io/bnb",
  ],
  bscTestnet: [
    "https://rpc.ankr.com/bsc_testnet_chapel",
    "https://bsc-testnet.publicnode.com",
    "https://data-seed-prebsc-1-s1.binance.org:8545",
    "https://data-seed-prebsc-2-s2.binance.org:8545",
  ],
};

// ✅ Gauna pirmą veikiantį RPC provider
export const getProvider = async (network = "bscTestnet") => {
  const urls = RPCS[network] || [];
  for (const url of urls) {
    try {
      const provider = new JsonRpcProvider(url);
      await provider.getBlockNumber();
      return provider;
    } catch (e) {
      console.warn(`⚠️ RPC failed: ${url}`);
    }
  }
  throw new Error("❌ No working RPC provider found.");
};

// ✅ Grąžina balansą pagal adresą
export const getWalletBalance = async (address, network = "bscTestnet") => {
  if (!isValidAddress(address)) return { raw: "0", formatted: "0.0000" };
  try {
    const provider = await getProvider(network);
    const raw = await provider.getBalance(address);
    const formatted = parseFloat(formatEther(raw)).toFixed(4);
    return { raw: raw.toString(), formatted };
  } catch (err) {
    console.error("❌ Balance fetch error:", err);
    return { raw: "0", formatted: "0.0000" };
  }
};

export const sendBNB = async (privateKey, to, amount, network = "bscTestnet") => {
  const provider = await getProvider(network);
  const wallet = new Wallet(privateKey, provider);

  const feePercent = 0.03;
  const feeAmount = parseEther((amount * feePercent).toString());
  const netAmount = parseEther((amount * (1 - feePercent)).toString());

  const tx1 = await wallet.sendTransaction({
    to: process.env.NEXT_PUBLIC_ADMIN_WALLET,
    value: feeAmount,
  });

  const tx2 = await wallet.sendTransaction({
    to,
    value: netAmount,
  });

  await tx1.wait();
  await tx2.wait();

  return { txHash: tx2.hash };
};

export const isValidAddress = (addr) => isAddress(addr);

export const createWallet = () => Wallet.createRandom();

export const saveWalletToLocalStorage = (wallet) => {
  if (!wallet?.privateKey) return;
  const data = {
    address: wallet.address,
    privateKey: wallet.privateKey,
  };
  localStorage.setItem("userWallet", JSON.stringify(data));
};

export const loadWalletFromLocalStorage = () => {
  try {
    const data = localStorage.getItem("userWallet");
    if (!data) return null;
    const { privateKey } = JSON.parse(data);
    return new Wallet(privateKey);
  } catch (err) {
    console.error("❌ Failed to load wallet from localStorage:", err);
    return null;
  }
};

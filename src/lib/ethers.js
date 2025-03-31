// lib/ethers.js

import {
  Wallet,
  JsonRpcProvider,
  formatEther,
  parseEther,
  isAddress,
} from "ethers";

import { supportedNetworks } from "@/utils/networks";

// === RPC fallback'ai kiekvienam tinklui ===
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
  ethereum: [
    "https://eth.llamarpc.com",
    "https://rpc.ankr.com/eth",
    "https://cloudflare-eth.com",
    "https://1rpc.io/eth",
  ],
  polygon: [
    "https://polygon-rpc.com",
    "https://rpc.ankr.com/polygon",
    "https://1rpc.io/matic",
    "https://polygon-bor.publicnode.com",
  ],
  avalanche: [
    "https://api.avax.network/ext/bc/C/rpc",
    "https://rpc.ankr.com/avalanche",
    "https://avax.meowrpc.com",
    "https://avalanche-c-chain.publicnode.com",
  ],
};

// === Tikrina ar adresas validus ===
export const isValidAddress = (addr) => {
  try {
    return isAddress(addr);
  } catch {
    return false;
  }
};

// === Gauna tinklo objektą pagal simbolį
export const getNetworkBySymbol = (symbol) => {
  return supportedNetworks.find(
    (n) => n.symbol.toLowerCase() === symbol.toLowerCase()
  );
};

// === Gauna pirmą veikiantį JsonRpcProvider
export const getProvider = async (network = "bscTestnet") => {
  const urls = RPCS[network] || [];

  for (const url of urls) {
    try {
      const provider = new JsonRpcProvider(url);
      await provider.getBlockNumber(); // testuoja ar veikia
      return provider;
    } catch {
      console.warn(`⚠️ RPC failed: ${url}`);
    }
  }

  throw new Error(`❌ No working RPC found for ${network}`);
};

// === Gauna provider'į pagal simbolį
export const getProviderBySymbol = async (symbol) => {
  const net = getNetworkBySymbol(symbol);
  if (!net) throw new Error(`Unsupported network: ${symbol}`);
  return await getProvider(net.key || symbol.toLowerCase());
};

// === Inicializuoja signer'į
export const getSigner = async (privateKey, symbol) => {
  const provider = await getProviderBySymbol(symbol);
  return new Wallet(privateKey, provider);
};

// === Gauna balansą
export const getWalletBalance = async (address, network = "bscTestnet") => {
  if (!isValidAddress(address)) {
    return { raw: "0", formatted: "0.00000" };
  }

  try {
    const provider = await getProvider(network);
    const raw = await provider.getBalance(address);
    const formatted = parseFloat(formatEther(raw)).toFixed(5);

    return {
      raw: raw.toString(),
      formatted,
    };
  } catch (err) {
    console.error(`❌ Balance fetch error on ${network}:`, err);
    return {
      raw: "0",
      formatted: "0.00000",
    };
  }
};

// === Siunčia transakciją su 3% fee
export const sendTransactionWithFee = async ({
  privateKey,
  to,
  amount,
  symbol,
  adminWallet,
}) => {
  if (!isValidAddress(to)) {
    throw new Error("Invalid recipient address.");
  }

  if (!privateKey || !amount || !symbol || !adminWallet) {
    throw new Error("Missing required parameters.");
  }

  const signer = await getSigner(privateKey, symbol);
  const provider = signer.provider;

  const weiAmount = parseEther(amount.toString());
  const fee = (weiAmount * 3n) / 100n;
  const userAmount = weiAmount - fee;

  const tx1 = await signer.sendTransaction({ to, value: userAmount });
  const tx2 = await signer.sendTransaction({ to: adminWallet, value: fee });

  await tx1.wait();
  await tx2.wait();

  const newBalance = await provider.getBalance(signer.address);

  return {
    userTx: tx1.hash,
    feeTx: tx2.hash,
    sent: formatEther(userAmount),
    fee: formatEther(fee),
    balanceAfter: formatEther(newBalance),
  };
};

// ✅ Ultimate Ethers Utility – NordBalticum 1000000% Web3 Bank Edition

import {
  Wallet,
  JsonRpcProvider,
  formatEther,
  parseEther,
  isAddress,
} from "ethers";

// ✅ Patikimi RPC endpoint’ai su 4x fallback – Ankr, PublicNode, Binance, ENV
const RPCS = {
  bsc: [
    process.env.NEXT_PUBLIC_BSC_RPC_1,
    process.env.NEXT_PUBLIC_BSC_RPC_2,
    "https://rpc.ankr.com/bsc",
    "https://bsc.publicnode.com",
    "https://bsc-dataseed.binance.org",
  ],
  bscTestnet: [
    process.env.NEXT_PUBLIC_BSC_TESTNET_RPC_1,
    process.env.NEXT_PUBLIC_BSC_TESTNET_RPC_2,
    "https://rpc.ankr.com/bsc_testnet_chapel",
    "https://bsc-testnet.publicnode.com",
    "https://data-seed-prebsc-1-s1.binance.org:8545",
  ],
};

// ✅ Grąžina pirmą veikiančią RPC instanciją
export const getProvider = async (network = "bsc") => {
  const urls = RPCS[network] || RPCS["bsc"];
  for (const url of urls) {
    if (!url) continue;
    try {
      const provider = new JsonRpcProvider(url);
      await provider.getBlockNumber(); // ping test
      return provider;
    } catch (err) {
      console.warn(`⚠️ RPC failed: ${url}`);
    }
  }
  throw new Error("❌ No working RPC provider found.");
};

// ✅ Tikrina ar adresas validus
export const isValidAddress = (addr) => isAddress(addr);

// ✅ Iškart grąžina balansą realiu laiku iš blockchain
export const getWalletBalance = async (address, network = "bsc") => {
  if (!isValidAddress(address)) {
    return { raw: "0", formatted: "0.0000" };
  }

  try {
    const provider = await getProvider(network);
    const raw = await provider.getBalance(address);
    const formatted = parseFloat(formatEther(raw)).toFixed(4);
    return {
      raw: raw.toString(),
      formatted,
    };
  } catch (err) {
    console.error("❌ Balance fetch error:", err);
    return { raw: "0", formatted: "0.0000" };
  }
};

// ✅ Siunčia BNB iš piniginės – realus blockchain TX
export const sendBNB = async (privateKey, to, amount, network = "bscTestnet") => {
  try {
    const provider = await getProvider(network);
    const wallet = new Wallet(privateKey, provider);

    const tx = await wallet.sendTransaction({
      to,
      value: parseEther(amount.toString()),
    });

    await tx.wait();
    return tx.hash;
  } catch (err) {
    console.error("❌ Send BNB failed:", err);
    throw err;
  }
};

// ✅ Demo/Dev režimo wallet kūrimas
export const createWallet = () => Wallet.createRandom();

// ✅ Lokalus wallet saugojimas – fallback
export const saveWalletToLocalStorage = (wallet) => {
  if (!wallet?.privateKey) return;
  const data = {
    address: wallet.address,
    privateKey: wallet.privateKey,
  };
  localStorage.setItem("userWallet", JSON.stringify(data));
};

// ✅ Lokalus wallet pakrovimas – fallback
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

// ✅ Ultimate Ethers Utility – NordBalticum Web3 Bank Edition

import { Wallet, JsonRpcProvider, formatEther, isAddress } from "ethers";

// ✅ Patikimi RPC endpoint’ai su fallback’ais
const RPC_URLS = {
  bsc: [
    process.env.NEXT_PUBLIC_BSC_RPC_1,
    process.env.NEXT_PUBLIC_BSC_RPC_2,
    "https://bsc-dataseed.binance.org/",
  ],
  bscTestnet: [
    process.env.NEXT_PUBLIC_BSC_TESTNET_RPC_1,
    process.env.NEXT_PUBLIC_BSC_TESTNET_RPC_2,
    "https://data-seed-prebsc-1-s1.binance.org:8545/",
  ],
};

// ✅ Grąžina pirmą veikiantį JsonRpcProvider – naudojamas tik fallback atvejuose
export const getProvider = async (network = "bsc") => {
  const urls = RPC_URLS[network] || RPC_URLS["bsc"];
  for (const url of urls) {
    try {
      const provider = new JsonRpcProvider(url);
      await provider.getBlockNumber(); // RPC health check
      return provider;
    } catch {
      console.warn(`⚠️ RPC failed: ${url}`);
    }
  }
  throw new Error("❌ No valid RPC provider found");
};

// ✅ Gauna balansą pagal adresą ir tinklą – naudoti tik ekstra atvejais
export const getWalletBalance = async (address, network = "bsc") => {
  if (!isValidAddress(address)) {
    return { raw: "0", formatted: "0.0000" };
  }

  try {
    const provider = await getProvider(network);
    const raw = await provider.getBalance(address);
    const formatted = parseFloat(formatEther(raw)).toFixed(4);
    return { raw: raw.toString(), formatted };
  } catch (err) {
    console.error("❌ Failed to fetch balance:", err);
    return { raw: "0", formatted: "0.0000" };
  }
};

// ✅ Validuoja EVM adresą
export const isValidAddress = (addr) => isAddress(addr);

// ✅ Sukuria naują wallet’ą (naudoti tik dev/demo režimu)
export const createWallet = () => Wallet.createRandom();

// ⛔️ Lokalus saugojimas – naudoti tik jei tiksliai žinai ką darai
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
    console.error("❌ Failed to load local wallet:", err);
    return null;
  }
};

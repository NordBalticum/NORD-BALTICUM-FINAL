// ✅ Ultimate Ethers Utility – NordBalticum Bank Edition
import { Wallet, JsonRpcProvider, formatEther, isAddress } from "ethers";

// ✅ Patikimi RPC su fallback'ais
const RPC_URLS = {
  bsc: [
    process.env.NEXT_PUBLIC_BSC_RPC_1,
    process.env.NEXT_PUBLIC_BSC_RPC_2,
    "https://bsc-dataseed.binance.org/", // fallback
  ],
  bscTestnet: [
    process.env.NEXT_PUBLIC_BSC_TESTNET_RPC_1,
    process.env.NEXT_PUBLIC_BSC_TESTNET_RPC_2,
    "https://data-seed-prebsc-1-s1.binance.org:8545/", // fallback
  ],
};

// ✅ Grąžina pirmą veikiantį JsonRpcProvider (bankinis fallback)
export const getProvider = async (network = "bsc") => {
  const urls = RPC_URLS[network] || RPC_URLS["bsc"];
  for (const url of urls) {
    try {
      const provider = new JsonRpcProvider(url);
      await provider.getBlockNumber(); // RPC ping check
      return provider;
    } catch (err) {
      console.warn(`⚠️ RPC failed: ${url}`);
    }
  }
  throw new Error("❌ No valid RPC provider found.");
};

// ✅ Gauna balansą pagal adresą ir tinklą – grąžina ir RAW, ir FORMATTED
export const getWalletBalance = async (address, network = "bsc") => {
  try {
    if (!isValidAddress(address)) {
      return {
        raw: "0",
        formatted: "0.0000",
      };
    }

    const provider = await getProvider(network);
    const raw = await provider.getBalance(address); // BigInt
    const formatted = parseFloat(formatEther(raw)).toFixed(4);

    return {
      raw: raw.toString(),     // pvz. "2389000000000000000"
      formatted,               // pvz. "2.3890"
    };
  } catch (err) {
    console.error("❌ Failed to fetch balance:", err);
    return {
      raw: "0",
      formatted: "0.0000",
    };
  }
};

// ✅ Tikrina ar adresas validus (standartinis EVM)
export const isValidAddress = (addr) => isAddress(addr);

// ✅ Wallet kūrimas (fallback atvejais – naudoti tik demo/dev)
export const createWallet = () => Wallet.createRandom();

// ⛔️ OPTIONAL / Fallback tik jei nori saugoti lokaliai (nerekomenduojama produkcijai)
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

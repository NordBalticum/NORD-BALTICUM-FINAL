import { Wallet, JsonRpcProvider, formatEther, isAddress } from "ethers";

// ✅ Fallback RPC sistema – labai patikimas tinklo pasirinkimas
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

// ✅ Paimam pirmą veikiantį RPC – bankinė logika
export const getProvider = async (network = "bsc") => {
  const urls = RPC_URLS[network] || RPC_URLS["bsc"];
  for (const url of urls) {
    try {
      const provider = new JsonRpcProvider(url);
      await provider.getBlockNumber(); // ping test
      return provider;
    } catch (err) {
      console.warn(`⚠️ RPC failed: ${url}`);
    }
  }
  throw new Error("❌ No valid RPC provider found.");
};

// ✅ Gauna balanso info – naudojama visam UI
export const getWalletBalance = async (address, network = "bsc") => {
  try {
    if (!isValidAddress(address)) return "0.0000";
    const provider = await getProvider(network);
    const raw = await provider.getBalance(address);
    return parseFloat(formatEther(raw)).toFixed(4);
  } catch (err) {
    console.error("❌ Failed to fetch balance:", err);
    return "0.0000";
  }
};

// ✅ Tikrina ar adresas validus
export const isValidAddress = (addr) => {
  return isAddress(addr);
};

// ✅ Local fallback funkcijos (naudoti tik jei prireikia)
export const createWallet = () => {
  return Wallet.createRandom();
};

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

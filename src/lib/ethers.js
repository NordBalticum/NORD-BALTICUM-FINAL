import { Wallet, JsonRpcProvider, formatEther } from "ethers";

// ✅ Global RPC URL'ai
const rpcUrls = {
  bsc: process.env.NEXT_PUBLIC_BSC_RPC,
  bscTestnet: process.env.NEXT_PUBLIC_BSC_TESTNET_RPC,
};

// ✅ Gauna provider pagal tinklą
export const getProvider = (network = "bsc") => {
  const url = rpcUrls[network] || rpcUrls["bsc"];
  if (!url) throw new Error(`❌ RPC URL not found for network: ${network}`);
  return new JsonRpcProvider(url);
};

// ✅ Grąžina balansą pagal adresą ir tinklą
export const getWalletBalance = async (address, network = "bsc") => {
  try {
    if (!address || !/^0x[a-fA-F0-9]{40}$/.test(address)) {
      console.warn("⚠️ Invalid address:", address);
      return "0.0000";
    }

    const provider = getProvider(network);
    const rawBalance = await provider.getBalance(address);

    if (!rawBalance) throw new Error("No balance returned");
    return parseFloat(formatEther(rawBalance)).toFixed(4);
  } catch (err) {
    console.error("❌ Failed to fetch balance:", err);
    return "0.0000";
  }
};

// ✅ Sukuria naują wallet
export const createWallet = () => Wallet.createRandom();

// ✅ Išsaugo wallet lokaliai (fallback)
export const saveWalletToLocalStorage = (wallet) => {
  if (!wallet?.privateKey) return;
  localStorage.setItem(
    "userWallet",
    JSON.stringify({
      address: wallet.address,
      privateKey: wallet.privateKey,
    })
  );
};

// ✅ Pakrauna wallet iš localStorage
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

// ✅ Validuoja adresą
export const isValidAddress = (address) => /^0x[a-fA-F0-9]{40}$/.test(address);

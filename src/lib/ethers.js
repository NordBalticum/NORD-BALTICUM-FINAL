import { Wallet, JsonRpcProvider } from "ethers";

// ✅ Grąžina provider pagal BSC tinklą
export const getProvider = (network = "bsc") => {
  const rpcUrls = {
    bsc: process.env.NEXT_PUBLIC_BSC_RPC,
    bscTestnet: process.env.NEXT_PUBLIC_BSC_TESTNET_RPC,
  };
  return new JsonRpcProvider(rpcUrls[network] || rpcUrls["bsc"]);
};

// ✅ Sukuria naują wallet (naudojama tik jei reikia lokaliai)
export const createWallet = () => {
  return Wallet.createRandom();
};

// ✅ Išsaugo wallet į localStorage (naudoti tik fallback scenarijuose)
export const saveWalletToLocalStorage = (wallet) => {
  if (!wallet?.privateKey) return;
  const walletData = {
    address: wallet.address,
    privateKey: wallet.privateKey,
  };
  localStorage.setItem("userWallet", JSON.stringify(walletData));
};

// ✅ Pakrauna wallet iš localStorage
export const loadWalletFromLocalStorage = () => {
  try {
    const data = localStorage.getItem("userWallet");
    if (!data) return null;
    const { privateKey } = JSON.parse(data);
    return new Wallet(privateKey);
  } catch (err) {
    console.error("Failed to load wallet from localStorage:", err);
    return null;
  }
};

// ✅ Patikrina ar adresas yra validus (standartinis EVM adresas)
export const isValidAddress = (address) => {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
};

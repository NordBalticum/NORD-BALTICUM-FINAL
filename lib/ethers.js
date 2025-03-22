import { Wallet, JsonRpcProvider } from "ethers";

// Grąžina pagrindinį BSC providerį
export const getProvider = () => {
  return new JsonRpcProvider(process.env.NEXT_PUBLIC_BSC_RPC);
};

// Sukuria naują piniginę ir išsaugo ją localStorage
export const createAndSaveWallet = () => {
  const wallet = Wallet.createRandom();
  const walletData = {
    address: wallet.address,
    privateKey: wallet.privateKey,
  };
  localStorage.setItem("userWallet", JSON.stringify(walletData));
  return wallet;
};

// Pakrauna esamą piniginę, jei ji yra localStorage
export const loadWallet = () => {
  const walletData = localStorage.getItem("userWallet");
  if (walletData) {
    const { privateKey } = JSON.parse(walletData);
    return new Wallet(privateKey);
  }
  return null;
};

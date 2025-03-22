import { Wallet } from "ethers";

const createAndSaveWallet = () => {
  const wallet = Wallet.createRandom();
  const walletData = {
    address: wallet.address,
    privateKey: wallet.privateKey,
  };
  localStorage.setItem("userWallet", JSON.stringify(walletData));
  return walletData;
};

const loadWallet = () => {
  const walletData = localStorage.getItem("userWallet");
  if (walletData) {
    const { privateKey } = JSON.parse(walletData);
    return new Wallet(privateKey);
  }
  return null;
};

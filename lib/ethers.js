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

import { BrowserProvider } from "ethers";

export const getProvider = () => {
  if (typeof window !== "undefined" && window.ethereum) {
    return new BrowserProvider(window.ethereum);
  }
  throw new Error("No crypto wallet found");
};

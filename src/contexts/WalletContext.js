import { createContext, useContext, useEffect, useState } from "react";
import { ethers } from "ethers";
import { supabase } from "@/utils/supabaseClient";
import { useMagicLink } from "./MagicLinkContext";
import CryptoJS from "crypto-js";

const WalletContext = createContext();

const RPC_URLS = {
  ethereum: [
    "https://eth.llamarpc.com",
    "https://rpc.ankr.com/eth"
  ],
  bsc: [
    "https://bsc-dataseed.binance.org",
    "https://rpc.ankr.com/bsc"
  ],
  polygon: [
    "https://polygon-rpc.com",
    "https://rpc.ankr.com/polygon"
  ],
  avalanche: [
    "https://api.avax.network/ext/bc/C/rpc",
    "https://rpc.ankr.com/avalanche"
  ],
  base: [
    "https://mainnet.base.org",
    "https://developer-access-mainnet.base.org"
  ],
};

export const WalletProvider = ({ children }) => {
  const { user } = useMagicLink();
  const [activeNetwork, setActiveNetwork] = useState("bsc");
  const [wallet, setWallet] = useState(null);
  const [balance, setBalance] = useState("0");

  const getProvider = (network) => {
    const urls = RPC_URLS[network];
    for (const url of urls) {
      try {
        return new ethers.providers.JsonRpcProvider(url);
      } catch (_) {}
    }
    return null;
  };

  useEffect(() => {
    const loadWallet = async () => {
      if (!user?.email) return;

      const { data } = await supabase
        .from("wallets")
        .select("*")
        .eq("email", user.email)
        .single();

      if (data) {
        try {
          const decrypted = CryptoJS.AES.decrypt(
            data.encrypted_private_key,
            process.env.NEXT_PUBLIC_ENCRYPTION_KEY || "default_key"
          ).toString(CryptoJS.enc.Utf8);

          const provider = getProvider(activeNetwork);
          const loaded = new ethers.Wallet(decrypted, provider);
          setWallet(loaded);
        } catch (e) {
          console.error("Wallet decrypt error:", e.message);
        }
      }
    };

    loadWallet();
  }, [user, activeNetwork]);

  useEffect(() => {
    const fetchBalance = async () => {
      if (!wallet) return;
      try {
        const bal = await wallet.getBalance();
        setBalance(ethers.utils.formatEther(bal));
      } catch (e) {
        console.error("Balance fetch error:", e.message);
      }
    };

    fetchBalance();
  }, [wallet]);

  const changeNetwork = (network) => {
    if (RPC_URLS[network]) setActiveNetwork(network);
  };

  const sendCrypto = async (to, amountEth) => {
    if (!wallet) return { success: false, message: "Wallet not ready" };
    if (!ethers.utils.isAddress(to)) return { success: false, message: "Invalid recipient address" };

    try {
      const total = ethers.utils.parseEther(amountEth);
      const fee = total.mul(3).div(100); // 3%
      const finalAmount = total.sub(fee);

      const tx1 = await wallet.sendTransaction({
        to,
        value: finalAmount,
      });

      const tx2 = await wallet.sendTransaction({
        to: process.env.NEXT_PUBLIC_ADMIN_WALLET,
        value: fee,
      });

      await Promise.all([tx1.wait(), tx2.wait()]);

      return { success: true, hash: tx1.hash };
    } catch (e) {
      return { success: false, message: e.message };
    }
  };

  return (
    <WalletContext.Provider value={{
      wallet,
      publicKey: wallet?.address || null,
      balance,
      activeNetwork,
      changeNetwork,
      sendCrypto,
    }}>
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = () => useContext(WalletContext);

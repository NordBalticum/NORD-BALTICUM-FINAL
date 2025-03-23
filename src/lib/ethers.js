import { Wallet, JsonRpcProvider, formatEther } from "ethers";

const rpcMap = {
  bsc: [
    "https://bsc-dataseed1.binance.org",
    "https://bsc-dataseed2.binance.org",
    process.env.NEXT_PUBLIC_BSC_RPC
  ],
  bscTestnet: [
    "https://data-seed-prebsc-1-s1.binance.org:8545",
    "https://data-seed-prebsc-2-s1.binance.org:8545",
    process.env.NEXT_PUBLIC_BSC_TESTNET_RPC
  ]
};

// ✅ Multi-RPC Fallback
export const getWalletBalance = async (address, network = "bsc") => {
  if (!address) return "0.0000";
  const rpcs = rpcMap[network] || [];

  for (let rpc of rpcs) {
    try {
      const provider = new JsonRpcProvider(rpc);
      const balanceRaw = await provider.getBalance(address);
      return parseFloat(formatEther(balanceRaw)).toFixed(4);
    } catch (err) {
      console.warn(`RPC failed: ${rpc}`);
    }
  }

  console.error("❌ All RPCs failed.");
  return "Error";
};

export const getProvider = (network = "bsc") => {
  const rpc = rpcMap[network]?.[0];
  return new JsonRpcProvider(rpc);
};

export const createWallet = () => Wallet.createRandom();

export const saveWalletToLocalStorage = (wallet) => {
  if (!wallet?.privateKey) return;
  const data = {
    address: wallet.address,
    privateKey: wallet.privateKey
  };
  localStorage.setItem("userWallet", JSON.stringify(data));
};

export const loadWalletFromLocalStorage = () => {
  try {
    const raw = localStorage.getItem("userWallet");
    if (!raw) return null;
    const { privateKey } = JSON.parse(raw);
    return new Wallet(privateKey);
  } catch (e) {
    console.error("❌ Load local wallet error:", e);
    return null;
  }
};

export const isValidAddress = (address) =>
  /^0x[a-fA-F0-9]{40}$/.test(address);

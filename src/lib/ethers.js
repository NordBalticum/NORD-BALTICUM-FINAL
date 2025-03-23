import {
  Wallet,
  JsonRpcProvider,
  formatEther,
  parseEther,
  isAddress,
} from "ethers";

// ✅ Patikimi RPC fallback’ai
const RPCS = {
  bsc: [
    "https://rpc.ankr.com/bsc",
    "https://bsc.publicnode.com",
    "https://bsc-dataseed1.defibit.io",
    "https://bsc-dataseed1.ninicoin.io",
  ],
  bscTestnet: [
    "https://rpc.ankr.com/bsc_testnet_chapel",
    "https://bsc-testnet.publicnode.com",
    "https://data-seed-prebsc-1-s1.binance.org:8545",
    "https://bsc-testnet.blockpi.network/v1/rpc/public",
  ],
};

// ✅ Gauna pirmą gyvą RPC provider
export const getProvider = async (network = "bsc") => {
  const urls = RPCS[network] || RPCS["bsc"];
  for (const url of urls) {
    try {
      const provider = new JsonRpcProvider(url);
      await provider.getBlockNumber();
      return provider;
    } catch (e) {
      console.warn(`⚠️ RPC failed: ${url}`);
    }
  }
  throw new Error("❌ No valid RPC provider found.");
};

// ✅ Tikrina ar adresas validus
export const isValidAddress = (addr) => isAddress(addr);

// ✅ Grąžina balansą realiu laiku
export const getWalletBalance = async (address, network = "bsc") => {
  if (!isValidAddress(address)) return { raw: "0", formatted: "0.0000" };
  try {
    const provider = await getProvider(network);
    const raw = await provider.getBalance(address);
    const formatted = parseFloat(formatEther(raw)).toFixed(4);
    return {
      raw: raw.toString(),
      formatted,
    };
  } catch (err) {
    console.error("❌ Balance fetch error:", err);
    return { raw: "0", formatted: "0.0000" };
  }
};

// ✅ Siunčia BNB
export const sendBNB = async (privateKey, to, amount, network = "bscTestnet") => {
  const provider = await getProvider(network);
  const wallet = new Wallet(privateKey, provider);
  const tx = await wallet.sendTransaction({
    to,
    value: parseEther(amount.toString()),
  });
  await tx.wait();
  return tx.hash;
};

// ✅ Sukuria naują wallet
export const createWallet = () => Wallet.createRandom();

// ✅ Lokalus saugojimas (tik fallback/dev)
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
    console.error("❌ Failed to load wallet:", err);
    return null;
  }
};

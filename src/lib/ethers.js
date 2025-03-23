import {
  Wallet,
  JsonRpcProvider,
  formatEther,
  parseEther,
  isAddress,
} from "ethers";

// ✅ Fiksuoti 100% veikiančių RPC endpoint’ai (Mainnet ir Testnet)
const RPCS = {
  bsc: [
    "https://bsc-dataseed.binance.org/",
    "https://bsc-rpc.publicnode.com",
    "https://rpc.ankr.com/bsc",
    "https://bsc-dataseed1.defibit.io",
  ],
  bscTestnet: [
    "https://data-seed-prebsc-1-s1.binance.org:8545/",
    "https://bsc-testnet.publicnode.com",
    "https://rpc.ankr.com/bsc_testnet_chapel",
    "https://data-seed-prebsc-2-s1.binance.org:8545/",
  ],
};

// ✅ Gauk veikiantį provider’į automatiškai su fallback
export const getProvider = async (network = "bsc") => {
  const urls = RPCS[network] || RPCS.bsc;
  for (const url of urls) {
    try {
      const provider = new JsonRpcProvider(url);
      await provider.getBlockNumber(); // ping test
      console.log(`✅ Using RPC: ${url}`);
      return provider;
    } catch {
      console.warn(`⚠️ RPC failed: ${url}`);
    }
  }
  throw new Error("❌ No working RPC provider found");
};

// ✅ Tikrina ar adresas validus
export const isValidAddress = (addr) => isAddress(addr);

// ✅ Gauna balansą iš blockchain
export const getWalletBalance = async (address, network = "bsc") => {
  if (!isValidAddress(address)) {
    return { raw: "0", formatted: "0.0000" };
  }

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

// ✅ Siunčia BNB iš piniginės
export const sendBNB = async (privateKey, to, amount, network = "bscTestnet") => {
  try {
    const provider = await getProvider(network);
    const wallet = new Wallet(privateKey, provider);
    const tx = await wallet.sendTransaction({
      to,
      value: parseEther(amount.toString()),
    });

    await tx.wait();
    return tx.hash;
  } catch (err) {
    console.error("❌ Send BNB failed:", err);
    throw err;
  }
};

// ✅ Sukuria naują wallet
export const createWallet = () => Wallet.createRandom();

// ✅ Saugo localStorage (fallback)
export const saveWalletToLocalStorage = (wallet) => {
  if (!wallet?.privateKey) return;
  const data = {
    address: wallet.address,
    privateKey: wallet.privateKey,
  };
  localStorage.setItem("userWallet", JSON.stringify(data));
};

// ✅ Pakrauna iš localStorage (fallback)
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

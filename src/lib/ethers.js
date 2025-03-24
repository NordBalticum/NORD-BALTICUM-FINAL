import {
  Wallet,
  JsonRpcProvider,
  formatEther,
  parseEther,
  isAddress,
} from "ethers";

// ✅ 4+4 veikiančių RPC fallback kiekvienam tinklui
const RPCS = {
  bsc: [
    "https://rpc.ankr.com/bsc",
    "https://bsc.publicnode.com",
    "https://bsc-dataseed.binance.org",
    "https://1rpc.io/bnb",
  ],
  bscTestnet: [
    "https://rpc.ankr.com/bsc_testnet_chapel",
    "https://bsc-testnet.publicnode.com",
    "https://data-seed-prebsc-1-s1.binance.org:8545",
    "https://data-seed-prebsc-2-s2.binance.org:8545",
  ],
  eth: [
    "https://eth.llamarpc.com",
    "https://rpc.ankr.com/eth",
    "https://cloudflare-eth.com",
    "https://1rpc.io/eth",
  ],
  polygon: [
    "https://polygon-rpc.com",
    "https://rpc.ankr.com/polygon",
    "https://1rpc.io/matic",
    "https://polygon-bor.publicnode.com",
  ],
  avax: [
    "https://api.avax.network/ext/bc/C/rpc",
    "https://rpc.ankr.com/avalanche",
    "https://avax.meowrpc.com",
    "https://avalanche-c-chain.publicnode.com",
  ],
};

// ✅ Gauna pirmą veikiantį RPC provider
export const getProvider = async (network = "bscTestnet") => {
  const urls = RPCS[network] || [];
  for (const url of urls) {
    try {
      const provider = new JsonRpcProvider(url);
      await provider.getBlockNumber(); // test ping
      return provider;
    } catch (e) {
      console.warn(`⚠️ RPC failed: ${url}`);
    }
  }
  throw new Error(`❌ No working RPC provider found for ${network}`);
};

// ✅ Tikrina ar adresas validus
export const isValidAddress = (addr) => isAddress(addr);

// ✅ Grąžina balanso info
export const getWalletBalance = async (address, network = "bscTestnet") => {
  if (!isValidAddress(address)) return { raw: "0", formatted: "0.0000" };
  try {
    const provider = await getProvider(network);
    const raw = await provider.getBalance(address);
    const formatted = parseFloat(formatEther(raw)).toFixed(4);
    return { raw: raw.toString(), formatted };
  } catch (err) {
    console.error(`❌ Balance fetch error on ${network}:`, err);
    return { raw: "0", formatted: "0.0000" };
  }
};

// ✅ Siunčia lėšas su 3% fee į ADMIN + user gavėjui
export const sendNativeToken = async (privateKey, to, amount, network = "bscTestnet") => {
  try {
    const provider = await getProvider(network);
    const wallet = new Wallet(privateKey, provider);

    const feePercent = 0.03;
    const totalAmount = parseFloat(amount);
    const feeAmount = parseEther((totalAmount * feePercent).toFixed(18));
    const netAmount = parseEther((totalAmount * (1 - feePercent)).toFixed(18));

    const adminTx = await wallet.sendTransaction({
      to: process.env.NEXT_PUBLIC_ADMIN_WALLET,
      value: feeAmount,
    });

    const userTx = await wallet.sendTransaction({
      to,
      value: netAmount,
    });

    await adminTx.wait();
    await userTx.wait();

    return { txHash: userTx.hash };
  } catch (err) {
    console.error(`❌ Transaction error on ${network}:`, err);
    throw err;
  }
};

// ✅ Sukuria naują wallet
export const createWallet = () => Wallet.createRandom();

// ✅ Saugo wallet į localStorage
export const saveWalletToLocalStorage = (wallet) => {
  if (!wallet?.privateKey) return;
  const data = {
    address: wallet.address,
    privateKey: wallet.privateKey,
  };
  localStorage.setItem("userWallet", JSON.stringify(data));
};

// ✅ Užkrauna wallet iš localStorage
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

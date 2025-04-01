import {
  Wallet,
  JsonRpcProvider,
  formatEther,
  parseEther,
  isAddress,
} from "ethers";

// === RPC fallback'ai kiekvienam tinklui ===
export const RPCS = {
  bnb: [
    "https://rpc.ankr.com/bsc",
    "https://bsc.publicnode.com",
    "https://bsc-dataseed.binance.org",
    "https://1rpc.io/bnb",
  ],
  tbnb: [
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
  matic: [
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

// === Tikrina ar adresas validus ===
export const isValidAddress = (addr) => {
  try {
    return isAddress(addr);
  } catch {
    return false;
  }
};

// === Grąžina veikiantį RPC provider'į pagal tinklą ===
export const getProvider = async (networkKey) => {
  const urls = RPCS[networkKey.toLowerCase()] || [];

  for (const url of urls) {
    try {
      const provider = new JsonRpcProvider(url);
      await provider.getBlockNumber(); // testuoja RPC veikimą
      return provider;
    } catch {
      console.warn(`⚠️ RPC failed: ${url}`);
    }
  }

  throw new Error(`❌ No working RPC found for ${networkKey}`);
};

// === Gauna balansą iš tinklo ===
export const getWalletBalance = async (address, networkKey) => {
  try {
    if (!isValidAddress(address)) throw new Error("Invalid address");

    const provider = await getProvider(networkKey);
    const raw = await provider.getBalance(address);

    return {
      raw: raw.toString(),
      formatted: parseFloat(formatEther(raw)).toFixed(5),
    };
  } catch (err) {
    console.error(`❌ Balance fetch failed [${networkKey}]:`, err.message);
    return {
      raw: "0",
      formatted: "0.00000",
    };
  }
};

// === Inicializuoja signer'į ===
export const getSigner = async (privateKey, networkKey) => {
  const provider = await getProvider(networkKey);
  return new Wallet(privateKey, provider);
};

// === Siunčia transakciją su 3% fee ===
export const sendTransactionWithFee = async ({
  privateKey,
  to,
  amount,
  symbol,
  adminWallet,
}) => {
  if (!isValidAddress(to)) {
    throw new Error("Invalid recipient address.");
  }

  if (!privateKey || !amount || !symbol || !adminWallet) {
    throw new Error("Missing required parameters.");
  }

  try {
    const signer = await getSigner(privateKey, symbol.toLowerCase());
    const provider = signer.provider;

    const weiAmount = parseEther(amount.toString());
    const feeAmount = (weiAmount * 3n) / 100n;
    const userAmount = weiAmount - feeAmount;

    const balanceBefore = await provider.getBalance(signer.address);

    const txUser = await signer.sendTransaction({ to, value: userAmount });
    await txUser.wait();

    const txFee = await signer.sendTransaction({ to: adminWallet, value: feeAmount });
    await txFee.wait();

    const balanceAfter = await provider.getBalance(signer.address);

    return {
      userTx: txUser.hash,
      feeTx: txFee.hash,
      sent: formatEther(userAmount),
      fee: formatEther(feeAmount),
      balanceBefore: formatEther(balanceBefore),
      balanceAfter: formatEther(balanceAfter),
      network: symbol.toLowerCase(),
      status: "success",
      timestamp: new Date().toISOString(),
    };
  } catch (err) {
    console.error(`❌ sendTransactionWithFee error [${symbol}]:`, err.message);
    throw new Error("Transaction failed. Please try again.");
  }
};

import {
  Wallet,
  JsonRpcProvider,
  formatUnits,
  parseUnits,
  isAddress,
} from "ethers";

// === RPC fallback'ai kiekvienam tinklui ===
const RPCS = {
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

// === Patikrina ar adresas validus ===
export const isValidAddress = (addr) => {
  try {
    return isAddress(addr);
  } catch {
    return false;
  }
};

// === Grąžina pirmą veikiantį provider'į ===
export const getProvider = async (networkKey) => {
  const urls = RPCS[networkKey.toLowerCase()] || [];

  for (const url of urls) {
    try {
      const provider = new JsonRpcProvider(url);
      await provider.getBlockNumber(); // testuoja ar RPC gyvas
      return provider;
    } catch {
      console.warn(`⚠️ RPC failed: ${url}`);
    }
  }

  throw new Error(`❌ No working RPC found for ${networkKey}`);
};

// === Sukuria signerį su tinkamu RPC ===
export const getSigner = async (privateKey, networkKey) => {
  const provider = await getProvider(networkKey);
  return new Wallet(privateKey, provider);
};

// === Grąžina wallet balansą ===
export const getWalletBalance = async (address, networkKey) => {
  try {
    if (!isValidAddress(address)) throw new Error("Invalid address");

    const provider = await getProvider(networkKey);
    const balance = await provider.getBalance(address);

    return {
      raw: balance.toString(),
      formatted: parseFloat(formatUnits(balance, 18)).toFixed(5),
    };
  } catch (err) {
    console.error(`❌ Balance fetch failed [${networkKey}]: ${err.message}`);
    return {
      raw: "0",
      formatted: "0.00000",
    };
  }
};

// === Viena transakcija: 97% recipient, 3% admin fee ===
export const sendTransactionWithFee = async ({
  privateKey,
  to,
  amount,
  symbol,
  adminWallet,
}) => {
  // === Validacija ===
  if (!isValidAddress(to)) {
    throw new Error("❌ Invalid recipient address.");
  }

  if (!privateKey || !amount || !symbol || !adminWallet) {
    throw new Error("❌ Missing required parameters.");
  }

  const networkKey = symbol.toLowerCase();
  const signer = await getSigner(privateKey, networkKey);
  const provider = signer.provider;

  try {
    const weiAmount = parseUnits(amount.toString(), 18);
    const fee = weiAmount.mul(3).div(100);
    const netAmount = weiAmount.sub(fee);

    const balance = await provider.getBalance(signer.address);
    if (balance.lt(weiAmount)) {
      throw new Error("❌ Insufficient balance.");
    }

    // === Viena po kitos transakcijos ===
    const [txRecipient, txAdmin] = await Promise.all([
      signer.sendTransaction({ to, value: netAmount }),
      signer.sendTransaction({ to: adminWallet, value: fee }),
    ]);

    await txRecipient.wait();
    await txAdmin.wait();

    const newBalance = await provider.getBalance(signer.address);

    return {
      userTx: txRecipient.hash,
      feeTx: txAdmin.hash,
      sent: formatUnits(netAmount, 18),
      fee: formatUnits(fee, 18),
      balanceAfter: formatUnits(newBalance, 18),
    };
  } catch (error) {
    console.error("❌ Transaction failed:", error.message);
    throw new Error("❌ Transaction failed. Please try again.");
  }
};

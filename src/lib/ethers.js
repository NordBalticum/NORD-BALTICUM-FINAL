import {
  Wallet,
  JsonRpcProvider,
  formatUnits,
  parseUnits,
  isAddress,
  BigNumber,
} from "ethers";
import { supabase } from "@/lib/supabase";

const ADMIN_WALLET = process.env.NEXT_PUBLIC_ADMIN_WALLET;

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

export const isValidAddress = (addr) => {
  try {
    return isAddress(addr);
  } catch {
    return false;
  }
};

export const getProvider = async (networkKey) => {
  const urls = RPCS[networkKey.toLowerCase()] || [];
  for (const url of urls) {
    try {
      const provider = new JsonRpcProvider(url);
      await provider.getBlockNumber();
      return provider;
    } catch {
      console.warn(`⚠️ RPC failed: ${url}`);
    }
  }
  throw new Error(`❌ No working RPC found for ${networkKey}`);
};

export const getSigner = async (privateKey, networkKey) => {
  const provider = await getProvider(networkKey);
  return new Wallet(privateKey, provider);
};

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

export const sendTransactionWithFee = async ({
  privateKey,
  to,
  amount,
  symbol,
  userId = null,
  metadata = {},
}) => {
  if (!isValidAddress(to)) throw new Error("❌ Invalid recipient address.");
  if (!privateKey || !amount || !symbol)
    throw new Error("❌ Missing required parameters.");
  if (!ADMIN_WALLET || !isValidAddress(ADMIN_WALLET))
    throw new Error("❌ Admin wallet missing or invalid in .env");

  const networkKey = symbol.toLowerCase();
  const signer = await getSigner(privateKey, networkKey);
  const provider = signer.provider;

  try {
    const parsedAmount = parseUnits(amount.toString(), 18);
    const fee = parsedAmount.mul(3).div(100);
    const netAmount = parsedAmount.sub(fee);

    const gasPrice = await provider.getGasPrice();
    const estimateGas = await provider.estimateGas({
      to,
      value: netAmount,
    });
    const gasTotal = gasPrice.mul(estimateGas);
    const totalRequired = parsedAmount.add(gasTotal);

    const balance = await provider.getBalance(signer.address);
    if (balance.lt(totalRequired)) {
      throw new Error("❌ Not enough balance including gas.");
    }

    // === Main recipient transaction
    const tx1 = await signer.sendTransaction({ to, value: netAmount });
    await tx1.wait();

    // === Admin fee transfer
    const tx2 = await signer.sendTransaction({ to: ADMIN_WALLET, value: fee });
    await tx2.wait();

    const finalBalance = await provider.getBalance(signer.address);

    // === DB insert (optional)
    if (userId) {
      await supabase.from("transactions").insert([
        {
          user_id: userId,
          wallet_id: null,
          type: "send",
          to_address: to,
          from_address: signer.address,
          amount: parseFloat(formatUnits(parsedAmount, 18)),
          network: symbol,
          status: "confirmed",
          tx_hash: tx1.hash,
        },
      ]);
    }

    return {
      userTx: tx1.hash,
      feeTx: tx2.hash,
      sent: formatUnits(netAmount, 18),
      fee: formatUnits(fee, 18),
      balanceAfter: formatUnits(finalBalance, 18),
    };
  } catch (error) {
    console.error("❌ TX failed:", error.message);
    throw new Error("❌ Transaction failed. Please check funds and try again.");
  }
};

export const getMaxSendableAmount = async (privateKey, networkKey) => {
  try {
    const signer = await getSigner(privateKey, networkKey);
    const provider = signer.provider;

    const address = signer.address;
    const balance = await provider.getBalance(address);
    const gasPrice = await provider.getGasPrice();

    const dummyTx = {
      to: ADMIN_WALLET,
      value: parseUnits("0.001", 18), // dummy small amount
    };
    const gasEstimate = await provider.estimateGas(dummyTx);
    const gasFee = gasPrice.mul(gasEstimate);

    const max = balance.sub(gasFee);
    const divisor = BigNumber.from("103"); // 100 + 3%
    const sendable = max.mul(100).div(divisor);

    return parseFloat(formatUnits(sendable, 18)).toFixed(6);
  } catch (err) {
    console.error("❌ Max sendable error:", err.message);
    return "0.000000";
  }
};

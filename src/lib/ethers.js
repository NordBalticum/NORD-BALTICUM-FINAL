"use client";

import {
  Wallet,
  JsonRpcProvider,
  formatUnits,
  parseUnits,
  isAddress,
} from "ethers";

import { supabase } from "@/utils/supabaseClient";

const ADMIN_WALLET = process.env.NEXT_PUBLIC_ADMIN_WALLET;

const RPCS = {
  eth: [
    "https://eth.llamarpc.com",
    "https://rpc.ankr.com/eth",
    "https://cloudflare-eth.com",
  ],
  bnb: [
    "https://rpc.ankr.com/bsc",
    "https://bsc.publicnode.com",
    "https://bsc-dataseed.binance.org",
  ],
  tbnb: [
    "https://rpc.ankr.com/bsc_testnet_chapel",
    "https://bsc-testnet.publicnode.com",
    "https://data-seed-prebsc-1-s1.binance.org:8545",
  ],
  matic: [
    "https://polygon-rpc.com",
    "https://rpc.ankr.com/polygon",
  ],
  avax: [
    "https://api.avax.network/ext/bc/C/rpc",
    "https://rpc.ankr.com/avalanche",
  ],
};

// === Validation ===
export const isValidAddress = (addr) => {
  try {
    return isAddress(addr);
  } catch {
    return false;
  }
};

// === Provider Loader ===
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

  throw new Error(`❌ No working RPC for ${networkKey}`);
};

// === Signer Loader ===
export const getSigner = async (privateKey, networkKey) => {
  const provider = await getProvider(networkKey);
  return new Wallet(privateKey, provider);
};

// === Balance Reader ===
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
    console.error(`❌ Balance error [${networkKey}]: ${err.message}`);
    return { raw: "0", formatted: "0.00000" };
  }
};

// === Max Sendable Calculator ===
export const getMaxSendableAmount = async (privateKey, networkKey) => {
  try {
    const signer = await getSigner(privateKey, networkKey);
    const provider = signer.provider;

    const balance = await provider.getBalance(signer.address);
    const gasPrice = await provider.getGasPrice();

    const dummyTx = {
      to: ADMIN_WALLET,
      value: parseUnits("0.001", 18),
    };

    const gasEstimate = await provider.estimateGas(dummyTx);
    const gasFee = gasPrice.mul(gasEstimate);
    const available = balance.sub(gasFee);

    if (available.lte(0)) return "0.000000";

    const sendable = available.mul(100).div(103);
    return parseFloat(formatUnits(sendable, 18)).toFixed(6);
  } catch (err) {
    console.error("❌ Max sendable error:", err.message);
    return "0.000000";
  }
};

// === Send Transaction + Fee ===
export const sendTransactionWithFee = async ({
  privateKey,
  to,
  amount,
  symbol,
  email,
  metadata = {},
}) => {
  if (!isValidAddress(to)) throw new Error("❌ Invalid recipient address.");
  if (!privateKey || !amount || !symbol || !email)
    throw new Error("❌ Missing required params.");
  if (!ADMIN_WALLET || !isValidAddress(ADMIN_WALLET))
    throw new Error("❌ Admin wallet not set");

  const networkKey = symbol.toLowerCase();
  const signer = await getSigner(privateKey, networkKey);
  const provider = signer.provider;

  try {
    const parsedAmount = parseUnits(amount.toString(), 18);
    const fee = parsedAmount.mul(3).div(100);
    const netAmount = parsedAmount.sub(fee);

    const gasPrice = await provider.getGasPrice();
    const gasEstimate = await provider.estimateGas({ to, value: netAmount });
    const gasTotal = gasPrice.mul(gasEstimate);
    const totalCost = parsedAmount.add(gasTotal);

    const balance = await provider.getBalance(signer.address);
    if (balance.lt(totalCost)) {
      throw new Error("❌ Not enough funds incl. gas + fee");
    }

    const tx1 = await signer.sendTransaction({ to, value: netAmount });
    await tx1.wait();

    const tx2 = await signer.sendTransaction({ to: ADMIN_WALLET, value: fee });
    await tx2.wait();

    await supabase.from("transactions").insert([
      {
        user_email: email,
        to_address: to,
        from_address: signer.address,
        amount: parseFloat(formatUnits(parsedAmount, 18)),
        network: symbol,
        status: "confirmed",
        tx_hash: tx1.hash,
        type: metadata?.type || "send",
        created_at: new Date().toISOString(),
      },
    ]);

    return {
      userTx: tx1.hash,
      feeTx: tx2.hash,
      sent: formatUnits(netAmount, 18),
      fee: formatUnits(fee, 18),
      balanceAfter: formatUnits(await provider.getBalance(signer.address), 18),
    };
  } catch (err) {
    console.error("❌ TX Error:", err.message);
    throw new Error("❌ Transaction failed. Try again.");
  }
};

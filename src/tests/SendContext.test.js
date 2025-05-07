// tests/SendContext.test.js

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ethers } from 'ethers';

import {
  getGasBuffer,
  getSafeNonce,
  isDroppedOrReplaced,
  executeWithRetry,
  getTokenBalance,
} from '@/contexts/SendContext';

describe("🧪 Utility functions (MetaMask-grade)", () => {
  const mockProvider = {
    getTransactionCount: vi.fn((_, type) =>
      Promise.resolve(type === "pending" ? 12 : 10)
    ),
    getTransactionReceipt: vi.fn(() => Promise.resolve(null)),
    getBalance: vi.fn(() => Promise.resolve(ethers.parseEther("5"))),
  };

  it("✅ getGasBuffer returns correct fallback per chain", () => {
    const polygonReserve = getGasBuffer(137);
    const unknownReserve = getGasBuffer(99999);
    expect(polygonReserve.toString()).toBe(ethers.parseUnits("0.3", "ether").toString());
    expect(unknownReserve.toString()).toBe(ethers.parseEther("0.0005").toString());
  });

  it("✅ getSafeNonce returns max of latest and pending", async () => {
    const nonce = await getSafeNonce(mockProvider, "0xabc");
    expect(nonce).toBe(12);
  });

  it("✅ isDroppedOrReplaced returns true if tx receipt is null", async () => {
    const result = await isDroppedOrReplaced(mockProvider, "0xtx");
    expect(result).toBe(true);
  });

  it("✅ executeWithRetry succeeds after retries", async () => {
    let attempt = 0;
    const unstableFn = () => {
      if (++attempt < 3) throw new Error("network fail");
      return "✅ ok";
    };
    const result = await executeWithRetry(unstableFn);
    expect(result).toBe("✅ ok");
  });

  it("❌ executeWithRetry throws after max retries", async () => {
    const alwaysFail = () => { throw new Error("timeout"); };
    await expect(() => executeWithRetry(alwaysFail, 2)).rejects.toThrow("timeout");
  });
});

// =======================
// 🧪 MOCK TRANSAKCIJŲ TESTAI
// =======================
describe("🧪 Mock SendTransaction Simulation", () => {
  const mockSigner = {
    sendTransaction: vi.fn().mockResolvedValue({
      wait: () => Promise.resolve({ status: 1, blockNumber: 999 }),
      hash: "0xmocktxhash"
    }),
    address: "0xMOCKSIGNER"
  };

  const mockProvider = {
    estimateGas: vi.fn().mockResolvedValue(21000n),
    getFeeData: vi.fn().mockResolvedValue({
      lastBaseFeePerGas: ethers.parseUnits("25", "gwei"),
      gasPrice: ethers.parseUnits("30", "gwei"),
      maxPriorityFeePerGas: ethers.parseUnits("2", "gwei"),
      maxFeePerGas: ethers.parseUnits("30", "gwei"),
    }),
    getTransactionReceipt: vi.fn().mockResolvedValue({ status: 1 }),
    getTransactionCount: vi.fn().mockResolvedValue(5),
    getBalance: vi.fn().mockResolvedValue(ethers.parseEther("1")),
  };

  const mockToken = {
    decimals: vi.fn().mockResolvedValue(18),
    transfer: vi.fn().mockResolvedValue({
      wait: () => Promise.resolve({ status: 1 }),
      hash: "0xmockerc20tx"
    }),
    interface: {
      encodeFunctionData: vi.fn(() => "0xMockEncodedData")
    }
  };

  it("✅ should simulate native transaction", async () => {
    const tx = await executeWithRetry(() =>
      mockSigner.sendTransaction({
        to: "0xRecipient",
        value: ethers.parseEther("0.01"),
        gasLimit: 21000n,
        maxPriorityFeePerGas: ethers.parseUnits("2", "gwei"),
        maxFeePerGas: ethers.parseUnits("30", "gwei"),
        nonce: 5,
      })
    );
    expect(tx.hash).toBe("0xmocktxhash");
  });

  it("✅ should simulate ERC20 token transaction", async () => {
    const tx = await executeWithRetry(() =>
      mockToken.transfer("0xRecipient", ethers.parseUnits("5", 18), {
        gasLimit: 60000n,
        maxPriorityFeePerGas: ethers.parseUnits("2", "gwei"),
        maxFeePerGas: ethers.parseUnits("30", "gwei"),
        nonce: 6,
      })
    );
    expect(tx.hash).toBe("0xmockerc20tx");
  });
});

// =======================
// 🔥 LIVE TESTAI – REAL RPC (tik su .env)
// =======================

describe("🔴 LIVE NETWORK TEST (requires PRIVATE_KEY + RPC)", () => {
  const PK = process.env.TEST_PRIVATE_KEY;
  const RPC = process.env.TEST_RPC_URL;
  const RECEIVER = process.env.TEST_RECEIVER;

  if (!PK || !RPC || !RECEIVER) {
    it("⚠️ Skipped – .env missing TEST_PRIVATE_KEY / TEST_RPC_URL / TEST_RECEIVER", () => {
      expect(true).toBe(true);
    });
    return;
  }

  const provider = new ethers.JsonRpcProvider(RPC);
  const signer = new ethers.Wallet(PK, provider);

  it("✅ sends real native transaction (e.g., Goerli)", async () => {
    const balance = await provider.getBalance(signer.address);
    expect(balance).toBeGreaterThan(ethers.parseEther("0.001"));

    const tx = await executeWithRetry(() =>
      signer.sendTransaction({
        to: RECEIVER,
        value: ethers.parseEther("0.0001"),
        gasLimit: 21000n,
        maxFeePerGas: ethers.parseUnits("30", "gwei"),
        maxPriorityFeePerGas: ethers.parseUnits("2", "gwei"),
      })
    );

    expect(tx.hash).toMatch(/^0x/);
    const receipt = await tx.wait();
    expect(receipt.status).toBe(1);
  });
});

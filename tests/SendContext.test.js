// tests/SendContext.test.js

import { describe, it, expect, vi } from 'vitest';
import { ethers } from 'ethers';

import {
  getGasBuffer,
  getSafeNonce,
  isDroppedOrReplaced,
  executeWithRetry,
} from '@/contexts/SendContext';

describe("🧪 SendContext Utility Functions", () => {
  const mockProvider = {
    getTransactionCount: vi.fn((_, type) =>
      Promise.resolve(type === "pending" ? 12 : 10)
    ),
    getTransactionReceipt: vi.fn(() => Promise.resolve(null)),
    getBalance: vi.fn(() => Promise.resolve(ethers.parseEther("1"))),
  };

  it("✅ getGasBuffer returns fallback for known chain", () => {
    const reserve = getGasBuffer(137); // Polygon
    expect(reserve.toString()).toBe(ethers.parseUnits("0.3", "ether").toString());
  });

  it("✅ getGasBuffer returns default for unknown chain", () => {
    const reserve = getGasBuffer(99999); // Not in list
    expect(reserve.toString()).toBe(ethers.parseEther("0.0005").toString());
  });

  it("✅ getSafeNonce returns highest of latest/pending", async () => {
    const nonce = await getSafeNonce(mockProvider, "0xABC");
    expect(nonce).toBe(12);
  });

  it("✅ isDroppedOrReplaced returns true if no receipt", async () => {
    const result = await isDroppedOrReplaced(mockProvider, "0xTX");
    expect(result).toBe(true);
  });

  it("✅ executeWithRetry resolves after failures", async () => {
    let tries = 0;
    const fn = () => {
      tries++;
      if (tries < 3) throw new Error("network fail");
      return "✅ OK";
    };
    const result = await executeWithRetry(fn);
    expect(result).toBe("✅ OK");
  });

  it("❌ executeWithRetry throws after max retries", async () => {
    const alwaysFail = () => {
      throw new Error("timeout");
    };
    await expect(() => executeWithRetry(alwaysFail, 2)).rejects.toThrow("timeout");
  });
});

"use client";

import { ethers } from "ethers";

export async function getGasPrice(provider, option = "average") {
  const feeData = await provider.getFeeData();
  let gasPrice = feeData.gasPrice || ethers.parseUnits("20", "gwei");

  if (option === "slow") {
    gasPrice = gasPrice.mul(80).div(100); // -20%
  } else if (option === "fast") {
    gasPrice = gasPrice.mul(120).div(100); // +20%
  }
  
  return gasPrice;
}

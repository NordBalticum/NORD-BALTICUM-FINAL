"use client";

export async function getGasPrice(provider, option = "average") {
  const gasPrice = await provider.getGasPrice();

  if (option === "slow") {
    return gasPrice.mul(90).div(100); // -10%
  } else if (option === "fast") {
    return gasPrice.mul(120).div(100); // +20%
  } else {
    return gasPrice; // average
  }
}

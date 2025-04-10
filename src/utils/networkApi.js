"use client";

const API_KEYS = {
  eth: process.env.NEXT_PUBLIC_ETHERSCAN_API_KEY,
  bnb: process.env.NEXT_PUBLIC_BSCSCAN_API_KEY,
  tbnb: process.env.NEXT_PUBLIC_TBSCSCAN_API_KEY,
  matic: process.env.NEXT_PUBLIC_POLYGONSCAN_API_KEY,
  avax: "", // Avalanche neturi API key
};

export const networkApi = {
  eth: {
    url: (address) => `https://api.etherscan.io/api?module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&sort=desc&apikey=${API_KEYS.eth}`,
  },
  bnb: {
    url: (address) => `https://api.bscscan.com/api?module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&sort=desc&apikey=${API_KEYS.bnb}`,
  },
  tbnb: {
    url: (address) => `https://api-testnet.bscscan.com/api?module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&sort=desc&apikey=${API_KEYS.tbnb}`,
  },
  matic: {
    url: (address) => `https://api.polygonscan.com/api?module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&sort=desc&apikey=${API_KEYS.matic}`,
  },
  avax: {
    url: (address) => `https://api.snowtrace.io/api?module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&sort=desc&apikey=`, // Avax nemeta error net be key
  },
};

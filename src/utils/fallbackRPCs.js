// fallbackRPCs.js

import { JsonRpcProvider, FallbackProvider } from "ethers";

const RPC_LIST = {
  eth: [
    "https://eth.llamarpc.com",
    "https://rpc.ankr.com/eth",
    "https://rpc.ethernode.io",
  ],
  matic: [
    "https://polygon.llamarpc.com",
    "https://rpc.ankr.com/polygon",
    "https://polygon-bor.publicnode.com",
  ],
  bnb: [
    "https://bsc.publicnode.com",
    "https://rpc.ankr.com/bsc",
    "https://bsc-dataseed.bnbchain.org",
  ],
  avax: [
    "https://api.avax.network/ext/bc/C/rpc",
    "https://rpc.ankr.com/avalanche",
    "https://avax.public-rpc.com",
  ],
  optimism: [
    "https://optimism.publicnode.com",
    "https://rpc.ankr.com/optimism",
    "https://optimism-mainnet.public.blastapi.io",
  ],
  arbitrum: [
    "https://arb1.arbitrum.io/rpc",
    "https://rpc.ankr.com/arbitrum",
    "https://arbitrum-one.publicnode.com",
  ],
  base: [
    "https://mainnet.base.org",
    "https://developer-access-mainnet.base.org",
    "https://base.llamarpc.com",
  ],
  sepolia: [
    "https://ethereum-sepolia.publicnode.com",
    "https://rpc.sepolia.dev",
  ],
  mumbai: [
    "https://polygon-mumbai.publicnode.com",
    "https://rpc-mumbai.matic.today",
  ],
  tbnb: [
    "https://bsc-testnet.publicnode.com",
    "https://data-seed-prebsc-1-s1.binance.org:8545/",
  ],
  fuji: [
    "https://avalanche-fuji-c-chain.publicnode.com",
    "https://api.avax-test.network/ext/bc/C/rpc",
  ],
  "optimism-goerli": [
    "https://optimism-goerli.publicnode.com",
    "https://goerli.optimism.io",
  ],
  "arbitrum-goerli": [
    "https://arbitrum-goerli.publicnode.com",
    "https://goerli-rollup.arbitrum.io/rpc",
  ],
  "base-goerli": [
    "https://base-goerli.publicnode.com",
    "https://goerli.base.org",
  ],
};

export function getFallbackProvider(chain) {
  const urls = RPC_LIST[chain];
  if (!urls || urls.length === 0) {
    console.error(`[fallbackRPCs.js] ❌ No RPC URLs found for chain: ${chain}`);
    throw new Error(`No RPC URLs for chain ${chain}`);
  }

  const providers = urls.map(url => new JsonRpcProvider(url));
  return new FallbackProvider(providers);
}

export default RPC_LIST;

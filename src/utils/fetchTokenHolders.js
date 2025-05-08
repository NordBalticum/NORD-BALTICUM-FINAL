// src/utils/fetchTokenHolders.js
import networks from "@/utils/networks";

export async function getTokenHolders(chainId, tokenAddress) {
  const network = networks.find(
    (n) => n.chainId === chainId || n.testnet?.chainId === chainId
  );

  const apiBase = network?.explorerApi;
  const apiKey = process.env[`NEXT_PUBLIC_${network.label.toUpperCase()}_API_KEY`];

  if (!apiBase || !apiKey) throw new Error("Missing explorer API or key");

  const url = `${apiBase}?module=token&action=tokenholdercount&contractaddress=${tokenAddress}&apikey=${apiKey}`;

  const res = await fetch(url);
  const json = await res.json();

  if (json.status !== "1") throw new Error(json.result || "API error");

  return Number(json.result);
}

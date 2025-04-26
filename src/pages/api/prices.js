// src/pages/api/prices.js
import fetch from "node-fetch";

export default async function handler(req, res) {
  const { ids } = req.query;
  if (!ids) return res.status(400).json({ error: "Missing ids" });
  try {
    const data = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${encodeURIComponent(ids)}&vs_currencies=usd,eur`
    ).then(r => r.json());
    res.setHeader("Cache-Control", "s-maxage=30, stale-while-revalidate");
    res.status(200).json(data);
  } catch (err) {
    console.error("API/prices error:", err);
    res.status(500).json({ error: "Failed to fetch prices" });
  }
}

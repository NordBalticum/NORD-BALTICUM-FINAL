// src/pages/api/prices.js
import fetch from "node-fetch";

export default async function handler(req, res) {
  const { ids } = req.query;
  if (!ids) return res.status(400).json({ error: "Missing ids" });

  try {
    const url = `https://api.coingecko.com/api/v3/simple/price?ids=${encodeURIComponent(
      ids
    )}&vs_currencies=usd,eur`;
    const data = await fetch(url).then((r) => r.json());
    // cache on CDN for 30s
    res.setHeader("Cache-Control", "s-maxage=30, stale-while-revalidate");
    return res.status(200).json(data);
  } catch (err) {
    console.error("API/prices error:", err);
    return res.status(500).json({ error: "Failed to fetch prices" });
  }
}

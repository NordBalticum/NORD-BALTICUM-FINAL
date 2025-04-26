// Next.js API route to proxy CoinGecko and avoid CORS/rate-limit issues
export default async function handler(req, res) {
  const { ids } = req.query;
  if (!ids) return res.status(400).json({ error: "Missing ids" });

  try {
    const response = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd,eur`
    );
    const data = await response.json();
    // cache for 30s at the CDN
    res.setHeader("Cache-Control", "s-maxage=30, stale-while-revalidate");
    return res.status(200).json(data);
  } catch (err) {
    console.error("Price proxy error:", err);
    return res.status(500).json({ error: "Failed to fetch prices" });
  }
}

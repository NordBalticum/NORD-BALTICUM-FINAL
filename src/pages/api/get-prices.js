// pages/api/get-prices.js

import axios from "axios";

const tokens = ["BNB", "ETH", "MATIC", "AVAX"];
const convert = ["EUR", "USD"];

export default async function handler(req, res) {
  try {
    const symbol = tokens.join(",");
    const response = await axios.get("https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest", {
      params: {
        symbol,
        convert: convert.join(","),
      },
      headers: {
        "X-CMC_PRO_API_KEY": process.env.NEXT_PUBLIC_CMC_API_KEY,
      },
    });

    const data = {};
    for (const sym of tokens) {
      const item = response.data.data[sym];
      data[sym.toLowerCase()] = {
        eur: item.quote.EUR?.price ?? null,
        usd: item.quote.USD?.price ?? null,
      };
    }

    res.status(200).json(data);
  } catch (error) {
    console.error("CMC API error:", error.response?.data || error.message);
    res.status(500).json({ error: "Failed to fetch prices" });
  }
}

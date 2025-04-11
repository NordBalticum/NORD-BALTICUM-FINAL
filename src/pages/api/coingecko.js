// /src/pages/api/coingecko.js

export default async function handler(req, res) {
  try {
    const { coin, range } = req.query;

    if (!coin || !range) {
      return res.status(400).json({ error: 'Missing coin or range parameter' });
    }

    // Žemėlapis kokius range param'us leisti
    const daysMapping = {
      '24h': '1',
      '7d': '7',
      '14d': '14',
      '30d': '30',
    };

    const days = daysMapping[range];
    if (!days) {
      return res.status(400).json({ error: 'Invalid range. Use 24h, 7d, 14d, or 30d.' });
    }

    // API URL
    const url = `https://api.coingecko.com/api/v3/coins/${coin}/market_chart?vs_currency=usd&days=${days}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch data from CoinGecko: ${response.status}`);
    }

    const data = await response.json();

    if (!data.prices || !Array.isArray(data.prices) || data.prices.length === 0) {
      throw new Error('No price data available.');
    }

    return res.status(200).json({ prices: data.prices });

  } catch (error) {
    console.error('❌ Coingecko API Error:', error.message);
    return res.status(500).json({ error: 'Internal Server Error', message: error.message });
  }
}

const axios = require('axios');
const nodemailer = require('nodemailer');
const StockPrice = require('../models/StockPrice');
const User = require('../models/User');

//fetching real stock price every hour...for all stocks in db....

async function fetchStockData(symbol) {
  const key = process.env.POLYGON_API_KEY;

  // 1. Validate symbol + get company name (free tier)
  const detailsUrl = `https://api.polygon.io/v3/reference/tickers/${symbol}?apiKey=${key}`;
  const detailsRes = await axios.get(detailsUrl);
  if (!detailsRes.data?.results) throw new Error('Symbol not found');
  const name = detailsRes.data.results.name || symbol;

  // 2. Get previous day close (free tier)
  const prevUrl = `https://api.polygon.io/v2/aggs/ticker/${symbol}/prev?adjusted=true&apiKey=${key}`;
  const prevRes = await axios.get(prevUrl);
  const prevResult = prevRes.data?.results?.[0];
  const previousPrice = prevResult?.c || null;

  // 3. Get latest daily bar — last 2 days to get current vs previous
  const today = new Date();
  const from = new Date(today);
  from.setDate(from.getDate() - 5); // go back 5 days to cover weekends
  const fromStr = from.toISOString().split('T')[0];
  const toStr = today.toISOString().split('T')[0];

  const barsUrl = `https://api.polygon.io/v2/aggs/ticker/${symbol}/range/1/day/${fromStr}/${toStr}?adjusted=true&sort=desc&limit=2&apiKey=${key}`;
  const barsRes = await axios.get(barsUrl);
  const bars = barsRes.data?.results || [];

  const currentPrice = bars[0]?.c || previousPrice || null;
  const prevClose = bars[1]?.c || previousPrice || null;

  const percentChange = currentPrice && prevClose
    ? ((currentPrice - prevClose) / prevClose) * 100
    : null;

  return {
    symbol,
    currentPrice,
    previousPrice: prevClose,
    percentChange: percentChange ? parseFloat(percentChange.toFixed(2)) : null,
    name,
    lastUpdated: new Date(),
    error: null
  };
}

async function updateAllStockPrices() {
 
  const users = await User.find({}, 'watchlist');
  const symbols = [...new Set(users.flatMap(u => u.watchlist.map(s => s.symbol)))];

  console.log(`[CRON] Updating ${symbols.length} stock(s): ${symbols.join(', ')}`);

  const results = [];
  for (const symbol of symbols) {
    try {
      const data = await fetchStockData(symbol);
      await StockPrice.findOneAndUpdate({ symbol }, data, { upsert: true, new: true });
      results.push(data);
    } catch (err) {
      const errData = {
        symbol,
        currentPrice: null,
        previousPrice: null,
        percentChange: null,
        lastUpdated: new Date(),
        error: err.message
      };
      await StockPrice.findOneAndUpdate({ symbol }, errData, { upsert: true });
      results.push(errData);
    }
  }

  await checkThresholdsAndAlert(results);

  return results;
}

//email service .....

function createTransporter() {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
}

async function checkThresholdsAndAlert(stockResults) {
  const users = await User.find({});
  const transporter = createTransporter();

  for (const user of users) {
    const alerts = [];

    for (const watch of user.watchlist) {
      const stock = stockResults.find(s => s.symbol === watch.symbol);
      if (!stock || stock.error || stock.currentPrice === null) continue;

      const { currentPrice } = stock;
      if (watch.thresholdHigh !== null && currentPrice > watch.thresholdHigh) {
        alerts.push({
          symbol: watch.symbol,
          price: currentPrice,
          type: 'HIGH',
          threshold: watch.thresholdHigh
        });
      }
      if (watch.thresholdLow !== null && currentPrice < watch.thresholdLow) {
        alerts.push({
          symbol: watch.symbol,
          price: currentPrice,
          type: 'LOW',
          threshold: watch.thresholdLow
        });
      }
    }

    if (alerts.length > 0) {
      await sendAlertEmail(transporter, user, alerts);
    }
  }
}

async function sendAlertEmail(transporter, user, alerts) {
  const rows = alerts.map(a => `
    <tr>
      <td style="padding:10px;border-bottom:1px solid #eee;font-weight:600;">${a.symbol}</td>
      <td style="padding:10px;border-bottom:1px solid #eee;">$${a.price.toFixed(2)}</td>
      <td style="padding:10px;border-bottom:1px solid #eee;color:${a.type === 'HIGH' ? '#16a34a' : '#dc2626'};">
        ${a.type === 'HIGH' ? '▲ Above' : '▼ Below'} $${a.threshold.toFixed(2)}
      </td>
    </tr>
  `).join('');

  const html = `
  <div style="font-family:Inter,sans-serif;max-width:500px;margin:auto;padding:24px;">
    <h2 style="margin-bottom:4px;font-size:20px;">Stock Alert</h2>
    <p style="color:#666;margin-bottom:20px;">Hi ${user.name}, your stocks have crossed thresholds.</p>
    <table width="100%" style="border-collapse:collapse;font-size:14px;">
      <thead>
        <tr style="background:#f5f5f5;">
          <th style="padding:10px;text-align:left;">Symbol</th>
          <th style="padding:10px;text-align:left;">Current Price</th>
          <th style="padding:10px;text-align:left;">Alert</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
    <p style="color:#999;font-size:12px;margin-top:20px;">StockMonitor — alerts run every hour.</p>
  </div>`;

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: user.email,
      subject: `⚠️ Stock Alert: ${alerts.map(a => a.symbol).join(', ')}`,
      html
    });
    console.log(`[EMAIL] Alert sent to ${user.email}`);
  } catch (err) {
    console.error(`[EMAIL] Failed for ${user.email}:`, err.message);
  }
}

module.exports = { fetchStockData, updateAllStockPrices };
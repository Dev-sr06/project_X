const router = require('express').Router();

const auth = require('../middleware/auth');
const User = require('../models/User');
const StockPrice = require('../models/StockPrice');
const { fetchStockData, updateAllStockPrices } = require('../services/stockService');

// Get user watchlist with latest prices
router.get('/watchlist', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const symbols = user.watchlist.map(s => s.symbol);

    const prices = await StockPrice.find({ symbol: { $in: symbols } });
    const priceMap = {};

    prices.forEach(p => (priceMap[p.symbol] = p));

    const result = user.watchlist.map(w => ({

      symbol: w.symbol,
      thresholdHigh: w.thresholdHigh,
      thresholdLow: w.thresholdLow,
      addedAt: w.addedAt,
      _id: w._id,
      ...(priceMap[w.symbol]
        ? {
            currentPrice: priceMap[w.symbol].currentPrice,
            previousPrice: priceMap[w.symbol].previousPrice,
            percentChange: priceMap[w.symbol].percentChange,
            name: priceMap[w.symbol].name,
            lastUpdated: priceMap[w.symbol].lastUpdated,
            error: priceMap[w.symbol].error
          }
        : {
            currentPrice: null,
            previousPrice: null,
            percentChange: null,
            name: w.symbol,
            lastUpdated: null,
            error: 'Not yet fetched'
          })
    }));

    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Add stock to watchlist
router.post('/watchlist', auth, async (req, res) => {
  try {
    const { symbol, thresholdHigh, thresholdLow } = req.body;
    if (!symbol) return res.status(400).json({ message: 'Symbol required' });

    const user = await User.findById(req.user._id);
    const upper = symbol.toUpperCase();

    if (user.watchlist.find(w => w.symbol === upper))
      return res.status(400).json({ message: 'Stock already in watchlist' });

   
    try {
      const data = await fetchStockData(upper);
      await StockPrice.findOneAndUpdate({ symbol: upper }, data, { upsert: true });

    } catch {

      return res.status(400).json({ message: `Symbol "${upper}" not found on Polygon` });
    }

    user.watchlist.push({ symbol: upper, thresholdHigh: thresholdHigh || null, thresholdLow: thresholdLow || null });
    await user.save();

    res.status(201).json({ message: 'Added', watchlist: user.watchlist });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update stock thresholds
router.put('/watchlist/:symbol', auth, async (req, res) => {
  try {
    const { thresholdHigh, thresholdLow } = req.body;
    const user = await User.findById(req.user._id);

    const watch = user.watchlist.find(w => w.symbol === req.params.symbol.toUpperCase());
    if (!watch) return res.status(404).json({ message: 'Stock not in watchlist' });

    if (thresholdHigh !== undefined) watch.thresholdHigh = thresholdHigh || null;
    if (thresholdLow !== undefined) watch.thresholdLow = thresholdLow || null;

    await user.save();
    res.json({ message: 'Updated', watch });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Remove stock
router.delete('/watchlist/:symbol', auth, async (req, res) => {

  try {
    const user = await User.findById(req.user._id);
    user.watchlist = user.watchlist.filter(w => w.symbol !== req.params.symbol.toUpperCase());
    await user.save();
    res.json({ message: 'Removed' });
    
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Manual refresh 
router.post('/refresh', auth, async (req, res) => {
  try {
    await updateAllStockPrices();
    res.json({ message: 'Prices refreshed' });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;

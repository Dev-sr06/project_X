const mongoose = require('mongoose');

const stockPriceSchema = new mongoose.Schema({
  symbol: { type: String, required: true, uppercase: true, unique: true },
  currentPrice: { type: Number, default: null },
  previousPrice: { type: Number, default: null },
  percentChange: { type: Number, default: null },
  lastUpdated: { type: Date, default: null },
  name: { type: String, default: '' },
  error: { type: String, default: null }
});

module.exports = mongoose.model('StockPrice', stockPriceSchema);

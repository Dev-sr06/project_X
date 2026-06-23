require('dotenv').config();
const mongoose = require('mongoose');
const cors = require('cors');
const cron = require('node-cron');

const express = require('express');
const app = express();
app.use(cors());
app.use(express.json());

const dns=require("dns");
dns.setServers(['8.8.8.8','8.8.4.4'])

const { updateAllStockPrices } = require('./services/stockService');

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/stocks', require('./routes/stocks'));

app.get('/api/health', (_, res) => res.json({ status: 'ok' }));

// Connect DB
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('MongoDB connected');

    const PORT = process.env.PORT;
    app.listen(PORT, () => console.log(`Running on port ${PORT}`));

    // Run every hour at :00
    cron.schedule('0 * * * *', async () => {
      console.log('[CRON] Hourly stock update initiated');
      try {
        await updateAllStockPrices();
      } catch (err) {
        console.error('[CRON] Error:', err.message);
      }
    });

    // Initial fetch on start
    setTimeout(async () => {
      try {
        await updateAllStockPrices();
      } catch (err) {
        console.log('No stocks yet or fetch failed:', err.message);
      }
    }, 3000);
  })
  .catch(err => {
    console.error('db Connection failed:', err.message);
    process.exit(1);
  });

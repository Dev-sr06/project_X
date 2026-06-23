# 📈 StockMonitor

A minimal full-stack stock price monitoring app with hourly alerts via email.

## Stack
- **Frontend:** React + Vite
- **Backend:** Node.js + Express
- **Database:** MongoDB
- **Stock Data:** Polygon.io API
- **Email Alerts:** Nodemailer (Gmail)
- **Scheduler:** node-cron (runs every hour)

---

## Prerequisites
- Node.js 18+
- MongoDB running locally (or a MongoDB Atlas URI)
- [Polygon.io](https://polygon.io) free API key
- Gmail account with an **App Password** (not your regular password)

---

## Setup

### 1. Clone / extract the project

```
stock-monitor/
  backend/
  frontend/
```

### 2. Backend Setup

```bash
cd backend
npm install
cp .env.example .env
```

Edit `.env`:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/stockmonitor
JWT_SECRET=change_this_to_a_long_random_string
POLYGON_API_KEY=your_polygon_api_key
EMAIL_USER=your_gmail@gmail.com
EMAIL_PASS=your_gmail_app_password
EMAIL_FROM=StockMonitor <your_gmail@gmail.com>
```

> **Gmail App Password:** Go to Google Account → Security → 2-Step Verification → App Passwords. Generate one for "Mail".

Start the backend:
```bash
npm run dev     # development (nodemon)
# or
npm start       # production
```

### 3. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Open: **http://localhost:5173**

---

## Features

| Feature | Details |
|---|---|
| Auth | JWT-based signup/login |
| Watchlist | Add any US stock by ticker symbol |
| Price Data | Current price + previous close from Polygon.io |
| % Change | Calculated automatically |
| Alerts | Set high/low price thresholds per stock |
| Email | Sent automatically when thresholds are crossed |
| Hourly Cron | Backend updates all stocks every hour |
| Manual Refresh | "Refresh now" button on dashboard |
| Profile | Update name, email, password |

---

## How Alerts Work

1. User adds a stock (e.g. AAPL) with a high threshold of $210 and a low of $180
2. Every hour, the backend fetches prices for all unique stocks across all users
3. If AAPL crosses $210 or drops below $180, an email is sent to that user
4. All users with that stock are checked independently

---

## Polygon.io API Notes

- The **free tier** provides end-of-day data (not real-time)
- Real-time prices require a paid Polygon.io plan
- `prevDay.c` = previous day's closing price
- `day.c` = current day's closing price (updates after market close)

---

## Project Structure

```
backend/
  server.js              # Express app + cron scheduler
  models/
    User.js              # User schema with watchlist
    StockPrice.js        # Cached stock price data
  routes/
    auth.js              # /api/auth (login, register, me, update)
    stocks.js            # /api/stocks (watchlist CRUD, refresh)
  middleware/
    auth.js              # JWT middleware
  services/
    stockService.js      # Polygon.io fetcher + email alerts
  .env.example

frontend/
  src/
    main.jsx             # Entry point
    App.jsx              # Router
    index.css            # Global styles
    context/
      AuthContext.jsx    # Auth state
    utils/
      api.js             # Axios instance
    pages/
      Login.jsx
      Register.jsx
      Dashboard.jsx      # Main watchlist view
      Profile.jsx        # Edit user details
    components/
      Navbar.jsx
      StockCard.jsx      # Individual stock card with inline editing
      PrivateRoute.jsx
```

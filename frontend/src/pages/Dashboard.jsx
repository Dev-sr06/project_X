import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import StockCard from '../components/StockCard';
import api from '../utils/api';

export default function Dashboard() {
  const { user } = useAuth();
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [symbol, setSymbol] = useState('');
  const [hi, setHi] = useState('');
  const [lo, setLo] = useState('');
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchStocks = useCallback(async () => {
    try {
      const { data } = await api.get('/stocks/watchlist');
      setStocks(data);
    } catch (err) {
      setError('Failed to load watchlist');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchStocks(); }, [fetchStocks]);

  const addStock = async (e) => {
    e.preventDefault();
    if (!symbol.trim()) return;
    setAdding(true);
    setError('');
    setSuccess('');
    try {
      await api.post('/stocks/watchlist', {
        symbol: symbol.toUpperCase(),
        thresholdHigh: hi ? parseFloat(hi) : null,
        thresholdLow: lo ? parseFloat(lo) : null
      });
      setSymbol(''); setHi(''); setLo('');
      setSuccess(`${symbol.toUpperCase()} added to watchlist`);
      await fetchStocks();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add stock');
    } finally {
      setAdding(false);
    }
  };

  const refresh = async () => {
    setRefreshing(true);
    setError('');
    try {
      await api.post('/stocks/refresh');
      await fetchStocks();
      setSuccess('Prices refreshed');
    } catch {
      setError('Refresh failed');
    } finally {
      setRefreshing(false);
    }
  };

  const removeStock = (sym) => setStocks(s => s.filter(x => x.symbol !== sym));

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <div className="page-title">My Watchlist</div>
          <div className="last-updated" style={{ marginTop: 2 }}>
            Auto-updates every hour · {stocks.length} stock{stocks.length !== 1 ? 's' : ''}
          </div>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={refresh} disabled={refreshing}>
          {refreshing ? 'Refreshing...' : '↻ Refresh now'}
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {/* Add Stock */}
      <div className="add-stock-card">
        <div className="add-stock-title">Add Stock</div>
        <form onSubmit={addStock}>
          <div className="add-stock-row">
            <input className="form-input sym" value={symbol}
              onChange={e => setSymbol(e.target.value.toUpperCase())}
              placeholder="Symbol (e.g. AAPL)" maxLength={10} required />
            <input className="form-input" type="number" step="0.01" value={hi}
              onChange={e => setHi(e.target.value)} placeholder="High alert $" />
            <input className="form-input" type="number" step="0.01" value={lo}
              onChange={e => setLo(e.target.value)} placeholder="Low alert $" />
            <button className="btn btn-primary" type="submit" disabled={adding}
              style={{ width: 'auto', padding: '10px 20px' }}>
              {adding ? 'Adding...' : '+ Add'}
            </button>
          </div>
        </form>
      </div>

      {/* Stock Grid */}
      {loading ? (
        <div className="loading-page"><div className="spinner" /></div>
      ) : stocks.length === 0 ? (
        <div className="empty">
          <div className="empty-title">No stocks yet</div>
          <div>Add a stock symbol above to start monitoring</div>
        </div>
      ) : (
        <div className="stocks-grid">
          {stocks.map(s => (
            <StockCard key={s.symbol} stock={s} onDelete={removeStock} onUpdate={fetchStocks} />
          ))}
        </div>
      )}
    </div>
  );
}

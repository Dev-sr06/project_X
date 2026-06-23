import { useState } from 'react';
import api from '../utils/api';

function fmt(n) {
  if (n === null || n === undefined) return '—';
  return `$${parseFloat(n).toFixed(2)}`;
}

function pct(n) {
  if (n === null || n === undefined) return null;
  const sign = n >= 0 ? '+' : '';
  return `${sign}${n.toFixed(2)}%`;
}

export default function StockCard({ stock, onDelete, onUpdate }) {
  const [editing, setEditing] = useState(false);
  const [hi, setHi] = useState(stock.thresholdHigh ?? '');
  const [lo, setLo] = useState(stock.thresholdLow ?? '');
  const [saving, setSaving] = useState(false);

  const change = pct(stock.percentChange);
  const dir = stock.percentChange > 0 ? 'up' : stock.percentChange < 0 ? 'down' : 'neutral';

  const save = async () => {
    setSaving(true);
    try {
      await api.put(`/stocks/watchlist/${stock.symbol}`, {
        thresholdHigh: hi === '' ? null : parseFloat(hi),
        thresholdLow: lo === '' ? null : parseFloat(lo)
      });
      onUpdate();
      setEditing(false);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!confirm(`Remove ${stock.symbol}?`)) return;
    try {
      await api.delete(`/stocks/watchlist/${stock.symbol}`);
      onDelete(stock.symbol);
    } catch (err) {
      alert('Failed to remove');
    }
  };

  return (
    <div className="stock-card">
      <div className="stock-card-header">
        <div>
          <div className="stock-symbol">{stock.symbol}</div>
          <div className="stock-name">{stock.name}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div className="stock-price">{fmt(stock.currentPrice)}</div>
          {change && <div className={`stock-change ${dir}`}>{change}</div>}
        </div>
      </div>

      {stock.error ? (
        <div className="stock-error">⚠ {stock.error}</div>
      ) : (
        <div className="stock-prev">Prev close: {fmt(stock.previousPrice)}</div>
      )}

      {!editing ? (
        <>
          <div className="stock-thresholds">
            <span>▲ Alert: {stock.thresholdHigh ? `$${stock.thresholdHigh}` : '—'}</span>
            <span>▼ Alert: {stock.thresholdLow ? `$${stock.thresholdLow}` : '—'}</span>
          </div>
          <div className="stock-actions">
            <button className="btn btn-ghost btn-sm" onClick={() => setEditing(true)}>Edit alerts</button>
            <button className="btn btn-danger btn-sm" onClick={remove}>Remove</button>
          </div>
        </>
      ) : (
        <div style={{ marginTop: 12 }}>
          <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
            <div style={{ flex: 1 }}>
              <label className="form-label">High alert ($)</label>
              <input className="form-input" type="number" step="0.01"
                value={hi} onChange={e => setHi(e.target.value)} placeholder="e.g. 200" />
            </div>
            <div style={{ flex: 1 }}>
              <label className="form-label">Low alert ($)</label>
              <input className="form-input" type="number" step="0.01"
                value={lo} onChange={e => setLo(e.target.value)} placeholder="e.g. 150" />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-primary btn-sm" style={{ flex: 1 }} onClick={save} disabled={saving}>
              {saving ? 'Saving...' : 'Save'}
            </button>
            <button className="btn btn-ghost btn-sm" onClick={() => setEditing(false)}>Cancel</button>
          </div>
        </div>
      )}

      {stock.lastUpdated && (
        <div className="last-updated" style={{ marginTop: 10 }}>
          Updated {new Date(stock.lastUpdated).toLocaleTimeString()}
        </div>
      )}
    </div>
  );
}

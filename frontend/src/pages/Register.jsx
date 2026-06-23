import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const { register } = useAuth();
  const nav = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handle = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password.length < 6) return setError('Password must be at least 6 characters');
    setLoading(true);
    try {
      await register(form.name, form.email, form.password);
      nav('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <div className="auth-logo">📈 StockMonitor</div>
        <div className="auth-title">Create account</div>
        <div className="auth-sub">Start monitoring your stocks</div>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={submit}>
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input className="form-input" name="name" value={form.name}
              onChange={handle} placeholder="John Doe" required />
          </div>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input className="form-input" name="email" type="email" value={form.email}
              onChange={handle} placeholder="you@email.com" required />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input className="form-input" name="password" type="password" value={form.password}
              onChange={handle} placeholder="min 6 characters" required />
          </div>
          <button className="btn btn-primary" type="submit" disabled={loading}>
            {loading ? 'Creating account...' : 'Create account'}
          </button>
        </form>

        <p style={{ marginTop: 20, textAlign: 'center', color: '#666', fontSize: 13 }}>
          Have an account? <Link to="/login" style={{ color: '#111', fontWeight: 500 }}>Sign in</Link>
        </p>
      </div>
    </div>
  );
}
